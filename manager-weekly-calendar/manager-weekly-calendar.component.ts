import { Component } from "@angular/core";
import * as Moment from "moment";
import { HolidayService } from "reservation/service/holiday.service";

export interface PeriodicElement {
    columns: string;
    tuesday: string;
    monday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
    { columns: "능운대", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "학소대", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "와룡암", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "첨성대", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "평상", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "식사", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    { columns: "비고", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
];

@Component({
    selector: "manager-weekly-calendar",
    templateUrl: "./manager-weekly-calendar.component.html",
    styleUrls: ["./manager-weekly-calendar.component.scss"],
})
export class ManagerWeeklyCalendarComponent {
    startDate = Moment();
    constructor(private holidayService: HolidayService) {
        this._setStartDate();
    }

    private _setStartDate() {
        this.startDate.date(this.startDate.date() - this.startDate.day() + 1);
        console.warn("_setStartDate", this.startDate.format("M/D"));
    }

    moveWeek(move: number) {
        this.startDate.date(this.startDate.date() + 7 * move);
        console.warn("moveWeek", this.startDate.date());
    }

    get currentWeek(): string {
        return `${this.startDate.format("YYYY.M.D")}(월) ~ ${this.startDate.month() + 1}.${this.startDate.date() + 6}(일)`;
    }

    displayedColumns: string[] = ["columns", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    dataSource = ELEMENT_DATA;

    getText(column: string): string {
        if (column === "monday") {
            return this.startDate.date() + "(월)";
        }
        if (column === "tuesday") {
            return this.startDate.date() + 1 + "(화)";
        }
        if (column === "wednesday") {
            return this.startDate.date() + 2 + "(수)";
        }
        if (column === "thursday") {
            return this.startDate.date() + 3 + "(목)";
        }
        if (column === "friday") {
            return this.startDate.date() + 4 + "(금)";
        }
        if (column === "saturday") {
            return this.startDate.date() + 5 + "(토)";
        }
        if (column === "sunday") {
            return this.startDate.date() + 6 + "(일)";
        }
        return "";
    }

    async isHoliday(day: string) {
        if (["saturday", "sunday"].includes(day)) {
            return true;
        }
        return false;
    }
}
