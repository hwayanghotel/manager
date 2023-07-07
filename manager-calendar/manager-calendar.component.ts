import { Component, EventEmitter, Output } from "@angular/core";
import { ManagerFilter } from "manager/manager-table/manager-table.component";
import { CalendarComponent } from "reservation/calendar/calendar.component";
import { HolidayService } from "reservation/service/holiday.service";
import * as Moment from "moment";
import { DBService, IUserDB } from "reservation/service/DB.service";
import { MAX_RESERVATION } from "reservation/service/reservation.service";

@Component({
    selector: "manager-calendar",
    templateUrl: "./manager-calendar.component.html",
    styleUrls: ["./manager-calendar.component.scss"],
})
export class ManagerCalendarComponent extends CalendarComponent {
    @Output() moveTable = new EventEmitter<void>();
    private cars: number[] = [];

    constructor(private holydayService: HolidayService, private DBService: DBService) {
        super(holydayService);

        this._setDailyCarNumber();
    }

    private _setDailyCarNumber() {
        this.DBService.customerDB$.subscribe((data) => {
            this.cars = [];
            (data as IUserDB[])
                .filter(
                    (v) =>
                        new Date(v["예약일"]).getFullYear() === this.currentYear &&
                        new Date(v["예약일"]).getMonth() === this.currentMonth - 1 &&
                        ["예약", "방문"].includes(v["상태"])
                )
                .forEach((v) => {
                    const index = new Date(v["예약일"]).getDate();
                    this.cars[index] = 0;
                    if (this.cars[index]) {
                        this.cars[index] += v["차량번호"] && v["차량번호"].length;
                    } else {
                        this.cars[index] = v["차량번호"] && v["차량번호"].length;
                    }
                });
        });
    }

    details(date: any) {
        ManagerFilter.date[0] = ManagerFilter.date[1] = Moment(`${this.currentYear}-${this.currentMonth}-${date.date}`);
        this.moveTable.emit();
    }

    carRatio(date: number): string {
        const cars = this.cars[date] ? this.cars[date] : 0;
        return `(${cars}/${MAX_RESERVATION["주차"]})`;
    }
}
