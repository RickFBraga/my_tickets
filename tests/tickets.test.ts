import app from "../src/index";
import request from "supertest";
import httpStatus from "http-status";
import prisma from "database";
import { faker } from "@faker-js/faker/.";
import { createNewTicket } from "services/tickets-service";
import supertest from "supertest";

const api = supertest(app);


beforeAll(async () => {
    await prisma.event.create({
        data: {
            name: faker.lorem.words(3),
            date: faker.date.future()
        },
    });

    await prisma.ticket.deleteMany();
});

describe("GET /health", () => {
    it("should return status code 200 and message", async () => {
        const { status, text } = await api.get("/health");
        expect(status).toBe(200);
        expect(text).toBe("I'm okay!");
    });
});
describe("Tickets Controller", () => {
    describe("GET /tickets/:eventId", () => {
        it("should return all tickets for a given event", async () => {
            const event = await prisma.event.findFirst();

            const response = await api.get(`/tickets/${1}`);
            expect(response.status).toBe(httpStatus.OK);
        });


        it("should throw an error if the event is expired", async () => {
            const expiredEvent = await prisma.event.create({
                data: {
                    name: "Expired Event",
                    date: faker.date.past()
                },
            });

            const ticketData = {
                eventId: expiredEvent.id,
                owner: "Regular",
                code: '5678',
            };

            try {
                await createNewTicket(ticketData);
            } catch (error) {
                expect(error.type).toBe("forbidden");
                expect(error.message).toBe("The event has already happened.");
            }
        });
    });

    const api = supertest(app);

    describe("PUT /tickets/use/:id", () => {
        it(
            "should return 204 when the ticket is successfully used",
            async () => {
                const event = await prisma.event.create({
                    data: {
                        name: "Event Test",
                        date: new Date(Date.now() + 86400000),
                    },
                });

                const ticket = await prisma.ticket.create({
                    data: {
                        eventId: event.id,
                        owner: "Test Owner",
                        code: "12345",
                        used: false,
                    },
                });

                const response = await api.put(`/tickets/use/${ticket.id}`);
                expect(response.status).toBe(204);

                const updatedTicket = await prisma.ticket.findUnique({
                    where: { id: ticket.id },
                });
                expect(updatedTicket?.used).toBe(true);
            },
            10000
        );
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

    it("should throw an error if the event is expired", async () => {
        const expiredEvent = await prisma.event.create({
            data: {
                name: `Pedro`,
                date: faker.date.past(),
            },
        });

        const ticketData = {
            eventId: expiredEvent.id,
            owner: "Regular",
            code: '5678',
        };

        try {
            await createNewTicket(ticketData);
        } catch (error) {
            expect(error.type).toBe("forbidden");
            expect(error.message).toBe("The event has already happened.");
        }
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

afterAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
});
function getSpecificTicket(nonExistentTicketId: number): any {
    throw new Error("Function not implemented.");
}

