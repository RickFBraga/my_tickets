import { faker } from "@faker-js/faker/.";
import { CreateTicketData } from "repositories/tickets-repository";

export function ticketFactory(): CreateTicketData {
    return {
        code: faker.lorem.word(1),
        owner: faker.lorem.word(1),
        eventId: faker.number.int({ min: 1, max: 5 })
    };
}
