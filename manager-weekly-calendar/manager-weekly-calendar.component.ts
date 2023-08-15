import { Component } from "@angular/core";
import * as Moment from "moment";
import { DBService, IUserDB } from "reservation/service/DB.service";
import { HolidayService } from "reservation/service/holiday.service";

export interface WeeklyElement {
    columns: string;
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
}

enum Columns {
    능운대, 학소대, 와룡암, 첨성대, 평상, 식사, 비고;
}

const WEEKLY_DATA: WeeklyElement[] = [
    { columns: "능운대", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "학소대", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "와룡암", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "첨성대", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "평상", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "식사", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    { columns: "비고", monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
];

@Component({
    selector: "manager-weekly-calendar",
    templateUrl: "./manager-weekly-calendar.component.html",
    styleUrls: ["./manager-weekly-calendar.component.scss"],
})
export class ManagerWeeklyCalendarComponent {
    startDate = Moment()
        .startOf("day")
        .subtract((Moment().day() - 1 + 7) % 7, "day");
    endDate = Moment()
        .startOf("day")
        .add((7 - Moment().day()) % 7, "days");
    holidayList = {
        columns: false,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true,
    };

    displayedColumns = Object.keys(WEEKLY_DATA[0]);
    dataSource = WEEKLY_DATA;

    private db: IUserDB[] = [];
    constructor(private holidayService: HolidayService, private DBService: DBService) {
        this._setHolidayList();
        setTimeout(() => {
            this.DBService.customerDB$.subscribe((db) => {
                this.db = db.filter((v) => ["예약", "방문", "완료"].includes(v["상태"]));
                this._setWeeklyData();
            });
        }, 2000);
    }

    private _setWeeklyData() {
        const db = this.db.filter((v) => Moment(v["예약일"]).diff(this.startDate) >= 0 && Moment(v["만료일"]).diff(this.endDate) <= 0);
        console.warn("db", db);

        this.displayedColumns.forEach((value, index) => {
            if (value !== "columns") {
                const now = Moment(this.startDate).add(index - 1, "days");
                const day = now.format("dddd").toLowerCase();
                const list = db.filter((v) => now.diff(Moment(v["예약일"])) >= 0 && now.diff(Moment(v["만료일"])) <= 0);
                console.warn(day, value, index, now.format("M/D"), list);

                list.forEach(item => {
                    if(item["예약유형"] === "객실"){
                        // WEEKLY_DATA[Columns[item["객실"]]]
                    } else if(item["예약유형"] === "평상"){

                    } else if(item["예약유형"] === "식사"){

                    }
                })
            }
        });
    }

    private async _setHolidayList() {
        let holidayList = await this.holidayService.getHolidays(this.startDate);
        holidayList = holidayList.filter((v) => v >= this.startDate.date() && v < this.startDate.date() + 7);
        if (this.startDate.month() != this.endDate.month()) {
            let holidayListNextMonth = (await this.holidayService.getHolidays(this.endDate)).filter((v) => v <= this.endDate.date());
            holidayList.push(...holidayListNextMonth);
        }

        this.holidayList = {
            columns: false,
            monday: holidayList.includes(this.startDate.date()),
            tuesday: holidayList.includes(Moment(this.startDate).add(1, "days").date()),
            wednesday: holidayList.includes(Moment(this.startDate).add(2, "days").date()),
            thursday: holidayList.includes(Moment(this.startDate).add(3, "days").date()),
            friday: holidayList.includes(Moment(this.startDate).add(4, "days").date()),
            saturday: true,
            sunday: true,
        };
    }

    moveWeek(move: number) {
        this.startDate.add(7 * move, "days");
        this.endDate.add(7 * move, "days");
        this._setHolidayList();
    }

    get currentWeek(): string {
        return `${this.startDate.format("YYYY.M.D")}(월) ~ ${this.endDate.format("M.D")}(일)`;
    }

    getDate(column: string): number {
        if (column === "columns") return undefined;
        const index = this.displayedColumns.indexOf(column);
        return this.endDate.date() - 7 + index > 0 ? this.endDate.date() - 7 + index : this.startDate.date() + index - 1;
    }

    isHoliday(day: string): boolean {
        return (this.holidayList as any)[day];
    }
}
