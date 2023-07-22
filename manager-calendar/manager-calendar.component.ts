import { Component, EventEmitter, Output } from "@angular/core";
import { ManagerFilter } from "manager/manager-table/manager-table.component";
import { CalendarComponent } from "reservation/calendar/calendar.component";
import { HolidayService } from "reservation/service/holiday.service";
import * as Moment from "moment";
import { DBService, IUserDB } from "reservation/service/DB.service";
import { MAX_RESERVATION, ReservationService } from "reservation/service/reservation.service";
import { MatDialog } from "@angular/material/dialog";

interface IRoomInfo {
    [room: string]: {
        text: string;
        color: string;
    };
}

@Component({
    selector: "manager-calendar",
    templateUrl: "./manager-calendar.component.html",
    styleUrls: ["./manager-calendar.component.scss"],
})
export class ManagerCalendarComponent extends CalendarComponent {
    @Output() moveTable = new EventEmitter<void>();
    private cars: any = {};
    rooms: any = {};
    roomTypes = ["능운대", "학소대", "와룡암", "첨성대"];
    filter = {
        showPassed: false,
        flatBench: true,
        food: true,
        room: true,
        car: true,
    };

    constructor(
        override holidayService: HolidayService,
        override DBService: DBService,
        override dialog: MatDialog,
        override reservationService: ReservationService
    ) {
        super(holidayService, DBService, dialog, reservationService);
        this.DBService.customerDB$.subscribe((data) => {
            const filteredData = data.filter((v) => ["예약", "방문"].includes(v["상태"]));
            this._setDailyCarNumber(filteredData);
            this._setDailyRoom(filteredData.filter((v) => v["객실"]));
        });
    }

    private _setDailyCarNumber(data: IUserDB[]) {
        this.cars = [];
        data.forEach((v) => {
            const index = v["예약일"];
            if (this.cars[index]) {
                this.cars[index] += v["차량번호"] && v["차량번호"].length;
            } else {
                this.cars[index] = v["차량번호"] && v["차량번호"].length;
            }
            if (v["이용박수"]) {
                for (let days = 1; days < v["이용박수"]; days++) {
                    const index = Moment(v["예약일"]).add(days, "days").format("YYYY-MM-DD");
                    if (this.cars[index]) {
                        this.cars[index] += v["차량번호"] && v["차량번호"].length;
                    } else {
                        this.cars[index] = v["차량번호"] && v["차량번호"].length;
                    }
                }
            }
        });
    }

    private _setDailyRoom(data: IUserDB[]) {
        const colors = ["LavenderBlush", "LightCyan", "LightGoldenRodYellow", "LightGreen", "LightPink", "LightSalmon", "LightSkyBlue", "LightSteelBlue"];
        let colorIndex = 0;
        let colorFlag = false;

        this.rooms = [];
        data.forEach((v) => {
            this.roomTypes.forEach((room) => {
                let bgColor: string = "";
                if (v["이용박수"] > 1 || ["능운대", "학소대", "와룡암", "첨성대"].filter((room) => v["객실"].includes(room)).length > 1) {
                    bgColor = colors[colorIndex];
                    colorFlag = true;
                }
                for (let days = 0; days < v["이용박수"]; days++) {
                    if (v["객실"].includes(room)) {
                        const index = Moment(v["예약일"]).add(days, "days").format("YYYY-MM-DD");
                        if (!this.rooms[index]) {
                            this.rooms[index] = {};
                        }
                        this.rooms[index][room] = {
                            text: v["성함"],
                            bgColor: bgColor,
                        };
                    }
                }
            });
            if (colorFlag) {
                colorIndex++;
                colorIndex %= colors.length;
                colorFlag = false;
            }
        });
    }

    override get typeList(): ("평상" | "식사" | "테이블")[] {
        return ["평상", "테이블", "식사"];
    }

    details(date: any) {
        ManagerFilter.date[0] = ManagerFilter.date[1] = Moment(`${this.currentYear}-${this.currentMonth}-${date.date}`);
        this.moveTable.emit();
    }

    carRatio(date: number): string {
        const today = Moment(this.selectedDate).date(date).format("YYYY-MM-DD");
        const cars = this.cars[today] ? this.cars[today] : 0;
        return ` (${cars}/${MAX_RESERVATION["주차"]})`;
    }

    getRoomInfo(date: number, room: string): string {
        const today = Moment(this.selectedDate).date(date).format("YYYY-MM-DD");
        if (this.rooms[today] && this.rooms[today][room]) {
            return this.rooms[today][room].text;
        }
        return "";
    }

    getBgColor(date: number, room: string): string {
        const today = Moment(this.selectedDate).date(date).format("YYYY-MM-DD");
        if (this.rooms[today] && this.rooms[today][room]) {
            return this.rooms[today][room].bgColor;
        }
        return "";
    }

    override isPassed(date: number): boolean {
        const baseDate = Moment(this.selectedDate).date(date);
        return baseDate.format("YYMMDDHH") < Moment().format("YYMMDDHH");
    }
}
