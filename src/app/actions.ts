'use server'

import { db } from '@/lib/db'
import { startOfDay, endOfDay, addMinutes, parseISO } from 'date-fns'

// --- DOCTOR ACTIONS ---

export async function generateSlotsForDay(dateStr: string) {
    // Config: 9:00 to 17:00, 30 min slots
    const startHour = 9;
    const endHour = 17;
    const duration = 30; // minutes

    // Parse YYYY-MM-DD
    // We create a date object at local time 00:00, then set hours
    const baseDate = new Date(dateStr);

    let current = new Date(baseDate);
    current.setHours(startHour, 0, 0, 0);

    const end = new Date(baseDate);
    end.setHours(endHour, 0, 0, 0);

    const slotsToCreate = [];

    while (current < end) {
        // We check if a slot already exists at this exact time
        // We can't do robust bulk "upsert" easily without unique constraints colliding in loop
        // So we just collect them and try to create one by one or filter first
        // For simplicity in this logic, we push to array
        slotsToCreate.push(new Date(current));
        current = addMinutes(current, duration);
    }

    let createdCount = 0;

    for (const time of slotsToCreate) {
        // Check if slot exists
        const existing = await db.slot.findUnique({
            where: { startTime: time }
        });

        if (!existing) {
            await db.slot.create({
                data: {
                    startTime: time,
                    status: 'AVAILABLE'
                }
            });
            createdCount++;
        }
    }

    return { success: true, count: createdCount };
}

export async function getDoctorSchedule(dateStr?: string) {
    // If dateStr provided, filter by date, else get all future?
    // For dashboard, maybe just get today's appointments

    let where = {};
    if (dateStr) {
        const date = new Date(dateStr);
        where = {
            startTime: {
                gte: startOfDay(date),
                lte: endOfDay(date)
            }
        };
    }

    const slots = await db.slot.findMany({
        where,
        include: { appointment: true },
        orderBy: { startTime: 'asc' }
    });

    return slots;
}

export async function toggleSlotStatus(slotId: string) {
    const slot = await db.slot.findUnique({ where: { id: slotId } });
    if (!slot) return { success: false };

    if (slot.status === 'AVAILABLE') {
        await db.slot.update({ where: { id: slotId }, data: { status: 'BLOCKED' } });
    } else if (slot.status === 'BLOCKED') {
        await db.slot.update({ where: { id: slotId }, data: { status: 'AVAILABLE' } });
    }
    // If BOOKED, we probably shouldn't toggle it lightly
    return { success: true };
}


// --- PATIENT ACTIONS ---

export async function getAvailableSlots(dateStr: string) {
    const date = new Date(dateStr);
    const slots = await db.slot.findMany({
        where: {
            startTime: {
                gte: startOfDay(date),
                lte: endOfDay(date)
            },
            status: 'AVAILABLE'
        },
        orderBy: { startTime: 'asc' }
    });

    // Serialize Dates for Client Components if needed, but Server Actions return clean JSON usually
    return slots;
}

export async function bookSlot(slotId: string, name: string, phone: string) {
    if (!name || !phone) return { success: false, message: 'Missing details' };

    try {
        // Simple check-then-act (for MVP without complicated transaction logic if replica set fails)
        const slot = await db.slot.findUnique({ where: { id: slotId } });
        if (!slot || slot.status !== 'AVAILABLE') return { success: false, message: 'Slot unavailable' };

        // This transaction should work on Atlas
        await db.$transaction([
            db.slot.update({
                where: { id: slotId },
                data: { status: 'BOOKED' }
            }),
            db.appointment.create({
                data: {
                    slotId,
                    patientName: name,
                    patientPhone: phone
                }
            })
        ]);

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Booking failed' };
    }
}

export async function getPatientAppointments(phone: string) {
    const appointments = await db.appointment.findMany({
        where: { patientPhone: phone },
        include: { slot: true },
        orderBy: { slot: { startTime: 'desc' } }
    });
    return appointments;
}
