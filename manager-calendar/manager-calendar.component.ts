import { Component, EventEmitter, Output } from "@angular/core";
import { ManagerFilter } from "manager/manager-table/manager-table.component";
import { CalendarComponent } from "reservation/calendar/calendar.component";
import { HolidayService } from "reservation/service/holiday.service";
import * as Moment from "moment";

@Component({
    selector: "manager-calendar",
    templateUrl: "./manager-calendar.component.html",
    styleUrls: ["./manager-calendar.component.scss"],
})
export class ManagerCalendarComponent extends CalendarComponent {
    @Output() moveTable = new EventEmitter<void>();

    constructor(private holydayService: HolidayService) {
        super(holydayService);
    }

    details(date: any) {
        ManagerFilter.date[0] = ManagerFilter.date[1] = Moment(`${this.currentYear}-${this.currentMonth}-${date.date}`);

        this.moveTable.emit();
    }
}
