import prisma from "database";
import app from "../src/index";
import { createEventData } from "./factories/event.factory";
import supertest from "supertest";
import errorHandlerMiddleware, { ERRORS } from "middlewares/error-middleware";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

describe("Events API", () => {
    beforeEach(async () => {
        await prisma.event.deleteMany();
    });

    const api = supertest(app)


    describe("GET /events", () => {
        it("should return a list of events", async () => {
            const event = await prisma.event.create({ data: createEventData() });

            const response = await api.get("/events");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: event.id,
                        name: event.name,
                    }),
                ])
            );
        });
    });



    describe("GET /events/:id", () => {
        it("should return the specific event", async () => {
            const event = await prisma.event.create({ data: createEventData() });

            const response = await api.get(`/events/${event.id}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.objectContaining({ id: event.id }));
        });


    });

    describe("POST /events", () => {
        it("should create a new event", async () => {
            const eventData = createEventData();

            const response = await api.post("/events").send(eventData);

            expect(response.status).toBe(201);
            const event = await prisma.event.findFirst({ where: { name: eventData.name } });
            expect(event).toBeTruthy();
        });
    });

    describe("PUT /events/:id", () => {
        it("should update an event", async () => {
            const event = await prisma.event.create({ data: createEventData() });
            const updatedData = { name: "Updated Event", date: new Date('05-05-2025') };

            const { status } = await api.put(`/events/${event.id}`).send(updatedData);

            expect(status).toBe(200);
            const updatedEvent = await prisma.event.findFirst({ where: { id: event.id } });
            expect(updatedEvent?.name).toBe(updatedData.name);
        });

        it("should return 422 if only one of the fields is null", async () => {
            const event = await prisma.event.create({ data: createEventData() });

            const fieldsToTest = [
                { name: null, date: "2024-12-05" },
                { name: "Event Name", date: null },
            ];

            for (const updatedData of fieldsToTest) {
                const { status } = await api.put(`/events/${event.id}`).send(updatedData);
                expect(status).toBe(422);
            }
        });

    });

    describe("DELETE /events/:id", () => {
        it("should delete an event", async () => {
            const event = await prisma.event.create({ data: createEventData() });

            const response = await api.delete(`/events/${event.id}`);

            expect(response.status).toBe(204);
            const deletedEvent = await prisma.event.findFirst({ where: { id: event.id } });
            expect(deletedEvent).toBeNull();
        });



    });

    describe("DELETE /events/:id", () => {
        it("should delete an event", async () => {
            const event = await prisma.event.create({ data: createEventData() });

            const response = await api.delete(`/events/${event.id}`);

            expect(response.status).toBe(204);
            const deletedEvent = await prisma.event.findFirst({ where: { id: event.id } });
            expect(deletedEvent).toBeNull();
        });
    });

    describe("errorHandlerMiddleware", () => {
        const mockRequest = {} as Request;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;
        const mockNext = jest.fn() as NextFunction;

        it("should return the correct status code and message for known error types", () => {
            const error = { type: "unauthorized", message: "Unauthorized error" };

            errorHandlerMiddleware(error, mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(ERRORS.unauthorized);
            expect(mockResponse.send).toHaveBeenCalledWith("Unauthorized error");
        });

        it("should return 500 for unknown error types", () => {
            const error = { type: "unknown_error", message: "Unknown error" };

            errorHandlerMiddleware(error, mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
            expect(mockResponse.send).toHaveBeenCalledWith("Unknown error");
        });

        it("should log the error", () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
            const error = { type: "conflict", message: "Conflict error" };

            errorHandlerMiddleware(error, mockRequest, mockResponse, mockNext);

            expect(consoleSpy).toHaveBeenCalledWith(error);
            consoleSpy.mockRestore();
        });
    });

});
