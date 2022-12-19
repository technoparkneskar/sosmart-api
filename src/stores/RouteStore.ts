import { Store } from "@sapphire/pieces";
import { cast, Constructor } from "@sapphire/utilities";
import { Route } from "./Route.js";

export class RouteStore extends Store<Route> {
    public constructor() {
        super(cast<Constructor<Route>>(Route), { name: "routes" });
    }
}
