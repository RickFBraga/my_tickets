import app from "../src/index";
import request from "supertest";
import httpStatus from "http-status";
import prisma from "database";
import { faker } from "@faker-js/faker/.";
import { getSpecificEvent } from "services/events-service";
import { createNewTicket } from "services/tickets-service";

beforeAll(async () => {
    await prisma.event.create({
        data: {
            name: faker.lorem.words(3),
            date: faker.date.future()
        },
    });

    await prisma.ticket.deleteMany();
});

describe("Tickets Controller", () => {

    describe("GET /tickets/:eventId", () => {
        it("should return all tickets for a given event", async () => {
            const event = await prisma.event.findFirst();

            await prisma.ticket.createMany({
                data: [
                    { eventId: event.id, owner: "VIP", code: '50' },
                    { eventId: event.id, owner: "Regular", code: '30' },
                ],
            });

            const response = await request(app).get(`/tickets/${event.id}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.length).toBe(2);
            expect(response.body[0].eventId).toBe(event.id);
        });
    });

    describe("POST /tickets", () => {
        it("should create a new ticket", async () => {
            const event = await prisma.event.findFirst();

            const newTicketData = {
                eventId: event.id,
                owner: "Regular",
                code: '200'
            };

            const response = await request(app)
                .post("/tickets")
                .send(newTicketData);

            expect(response.status).toBe(httpStatus.CREATED);
            expect(response.body.owner).toBe(newTicketData.owner);
            expect(response.body.code).toBe(newTicketData.code);

            const createdTicket = await prisma.ticket.findUnique({
                where: { id: response.body.id },
            });
            expect(createdTicket).not.toBeNull();
            expect(createdTicket?.code).toBe(newTicketData.code);
        });

        it("should throw an error if a ticket with the same code already exists for the event", async () => {
            const event = await prisma.event.create({
                data: {
                    name: "New Event",
                    date: faker.date.future(),
                },
            });

            const existingTicketData = {
                eventId: event.id,
                owner: "VIP",
                code: '1234',
            };

            await createNewTicket(existingTicketData);

            const newTicketData = {
                eventId: event.id,
                owner: "Regular",
                code: '1234',
            };

            try {
                await createNewTicket(newTicketData);
            } catch (error) {
                expect(error.type).toBe("conflict");
                expect(error.message).toBe(`Ticket with code ${newTicketData.code} for event id ${event.id} already registered.`);
            }
        });
    });
});

afterAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
});
