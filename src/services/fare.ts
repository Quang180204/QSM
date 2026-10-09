import { vehicles } from "../data/catalog";
import { wait } from "./maps";
export const fareService = {
  async quote() {
    await wait(450);
    return vehicles;
  },
};
