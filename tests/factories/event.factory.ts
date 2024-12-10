import { faker } from "@faker-js/faker";

export function createEventData() {
    return {
        name: faker.lorem.words(3),
        date: faker.date.future()
    };
}
