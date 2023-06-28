import { Component } from "@angular/core";
import { ContentFoodComponent } from "reservation/calendar/content-food/content-food.component";

@Component({
    selector: "manager-content-food",
    templateUrl: "./manager-content-food.component.html",
    styleUrls: ["../manager-calendar.component.scss"],
})
export class ManagerContentFoodComponent extends ContentFoodComponent {
    getText(value: string): string {
        return value.slice(0, 3);
    }
}
