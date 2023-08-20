import { ChangeDetectorRef, Component } from "@angular/core";
import * as Moment from "moment";
import "moment/locale/ko";
import { DBService, IUserDB } from "reservation/service/DB.service";
import { HolidayService } from "reservation/service/holiday.service";
import { debounceTime } from "rxjs";

interface TableContent {
    id: string;
    name: string;
    ddunayo?: boolean;
    tel?: string;
    car?: string;
    food?: string;
    type?: string;
    memo?: string;
    bgColor?: string;
}

interface DailyData {
    날짜?: string;
    능운대?: TableContent[];
    학소대?: TableContent[];
    와룡암?: TableContent[];
    첨성대?: TableContent[];
    평상?: TableContent[];
    메모?: string;
}

@Component({
    selector: "manager-weekly-calendar",
    templateUrl: "./manager-weekly-calendar.component.html",
    styleUrls: ["./manager-weekly-calendar.component.scss"],
})
export class ManagerWeeklyCalendarComponent {
    startDate = Moment()
        .startOf("day")
        .subtract((Moment().day() - 1 + 7) % 7, "day");

    weeklyData: any[] = [];
    dailyList: { [key: string]: DailyData } = {};

    private db: IUserDB[] = [];
    private _holidayList: number[] = [];

    constructor(private holidayService: HolidayService, private DBService: DBService, private cdr: ChangeDetectorRef) {
        this._setHolidayList();
        this.DBService.customerDB$.pipe(debounceTime(300)).subscribe((db) => {
            this.db = db.filter((v) => ["예약", "방문", "완료"].includes(v["상태"]));
            this._setDailyList();
            this._setWeeklyData();
        });
    }

    get displayedColumns(): string[] {
        const columns = ["id"];
        for (let i = 0; i < 7; i++) {
            const date = Moment(this.startDate).add(i, "days").format("M/D(dd)");
            columns.push(date);
        }
        return columns;
    }

    private _setWeeklyData() {
        let weeklyData = [];
        for (let id of ["능운대", "학소대", "와룡암", "첨성대", "평상", "메모"]) {
            let data: any = { id: id };
            this.displayedColumns
                .filter((v) => v !== "id")
                .forEach((date) => {
                    if (this.dailyList[date] && (this.dailyList[date] as any)[id]) {
                        (data[date] as TableContent[]) = (this.dailyList[date] as any)[id];
                    } else {
                        (data[date] as TableContent[]) = [
                            {
                                id: undefined,
                                name: undefined,
                                tel: undefined,
                            },
                        ];
                    }
                });
            weeklyData.push(data);
        }
        this.weeklyData = weeklyData;
        this.cdr.detectChanges();
        console.warn("weeklyData", weeklyData);
    }

    private _setDailyList() {
        const colors = ["LavenderBlush", "LightCyan", "LightGoldenRodYellow", "LightGreen", "LightPink", "LightSalmon", "LightSkyBlue", "LightSteelBlue"];
        let colorIndex = 0;
        let colorFlag = false;

        this.dailyList = {};
        const roomIDList: string[] = [];

        this.db.forEach((user) => {
            const bookingDates = [];
            if (user["객실"]) {
                for (let i = 0; i < user["이용박수"]; i++) {
                    bookingDates.push(Moment(user["예약일"]).add(i, "days").format("M/D(dd)"));
                }
            } else {
                bookingDates.push(Moment(user["예약일"]).format("M/D(dd)"));
            }
            bookingDates.forEach((bookingDate) => {
                let content: TableContent = {
                    id: user.id,
                    name: `${user["성함"]}(${user["인원"] ? user["인원"] : "?"}명)`,
                    tel: user["전화번호"],
                    ddunayo: true,
                };
                if (user["차량번호"] && user["차량번호"].length) {
                    content.car = `차량:${String(user["차량번호"])}`;
                }
                if (user["관리자메모"]) {
                    content.memo = `${user["관리자메모"]}`;
                }
                if (this.getFoods(user)) {
                    content.food = `${this.getFoods(user)} (${user["예약시간"] ? user["예약시간"] + "시" : "시간미정"})`;
                }
                this.dailyList[bookingDate] ??= {};
                this.dailyList[bookingDate]["날짜"] = bookingDate;

                if (user["예약유형"] === "객실") {
                    if (user["이용박수"] > 1 || user["객실"].includes(",")) {
                        content.bgColor = colors[colorIndex];
                        colorFlag = true;
                    }
                    user["객실"]
                        .split(",")
                        .map((v) => v.trim())
                        .forEach((room) => {
                            if (roomIDList.includes(user.id)) {
                                const filteredContent: TableContent = {
                                    id: content.id,
                                    name: content.name,
                                    ddunayo: content.ddunayo,
                                    bgColor: content.bgColor,
                                };
                                content = filteredContent;
                            }
                            this.dailyList[bookingDate][room as "능운대" | "학소대" | "와룡암" | "첨성대"] ??= [];
                            this.dailyList[bookingDate][room as "능운대" | "학소대" | "와룡암" | "첨성대"].push(content);

                            if (!roomIDList.includes(user.id)) {
                                roomIDList.push(user.id);
                            }
                        });
                }
                if (user["예약유형"] === "평상") {
                    if (user["평상"]) {
                        content.type = `[평상 ${user["평상"]}대]`;
                    }
                    if (user["테이블"]) {
                        content.type = content.type ? `${content.type}, 데크(${user["테이블"]})` : `데크(${user["테이블"]})`;
                    }
                    this.dailyList[bookingDate]["평상"] ??= [];
                    this.dailyList[bookingDate]["평상"].push(content);
                }
            });
            if (colorFlag) {
                colorIndex++;
                colorIndex %= colors.length;
                colorFlag = false;
            }
        });
        console.warn("dailyList", this.dailyList);
    }

    private getFoods(user: IUserDB): string {
        let text;
        if (user["능이백숙"]) {
            text = `능이:${user["능이백숙"]}`;
        }
        if (user["백숙"]) {
            text = text ? `${text}, 한방:${user["백숙"]}` : `한방:${user["백숙"]}`;
        }
        if (user["버섯찌개"]) {
            text = text ? `${text}, 버섯:${user["버섯찌개"]}` : `버섯:${user["버섯찌개"]}`;
        }
        if (user["버섯찌개2"]) {
            text = text ? `${text}, 버섯2인:${user["버섯찌개2"]}` : `버섯2인:${user["버섯찌개2"]}`;
        }

        return text;
    }

    isHoliday(date: string): boolean {
        try {
            const days = Number(date.split("/")[1].split("(")[0]);
            return this._holidayList.includes(days);
        } catch {
            return false;
        }
    }

    private async _setHolidayList() {
        let holidayList = await this.holidayService.getHolidays(this.startDate);
        holidayList = holidayList.filter((v) => v >= this.startDate.date() && v < this.startDate.date() + 7);

        const endDate = Moment(this.startDate).add(6, "day");
        if (this.startDate.month() != endDate.month()) {
            let holidayListNextMonth = (await this.holidayService.getHolidays(endDate)).filter((v) => v <= endDate.date());
            holidayList.push(...holidayListNextMonth);
        }
        this._holidayList = holidayList;
    }

    moveWeek(move: number) {
        this.startDate.add(7 * move, "days");
        this._setHolidayList();
        this._setWeeklyData();
    }

    get currentWeek(): string {
        const endDate = Moment(this.startDate).add(6, "day").format("M.D(dd)");
        return `${this.startDate.format("YYYY.M.D(dd)")} ~ ${endDate}`;
    }
}
