import { Component, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { IReservationForm } from "reservation/service/reservation.service";
import * as Moment from "moment";
import { DBService, IDBService } from "reservation/service/DB.service";

interface Table {
    id: string;
    visit: boolean;
    date: string;
    type: "평상" | "식사" | "객실";
    name: string;
    status: string;
    order: string;
    memo: string;
}

interface Filter {
    open: boolean;
    date: Moment.Moment[];
    states: string[];
}

const initFilter: Filter = {
    open: true,
    date: [],
    states: ["대기중", "예약완료"],
};
export let ManagerFilter: Filter = JSON.parse(JSON.stringify(initFilter));

@Component({
    selector: "manager-table",
    templateUrl: "./manager-table.component.html",
})
export class ManagerTableComponent {
    @ViewChild(MatSort) sort: MatSort;
    displayedColumns: string[] = ["visit", "date", "type", "name", "status", "order", "memo"];
    dataSource: MatTableDataSource<any>;
    db: IDBService[] = [];
    filter = ManagerFilter;

    constructor(private DBService: DBService) {
        this.DBService.firebaseStore$.subscribe((db) => {
            this.db = db as IDBService[];
            this.db.sort((a, b) => this._sortList(a, b));
            this.setList();
        });
        this.filter = ManagerFilter;
    }

    get statePrepare(): boolean {
        return ManagerFilter.states.includes("대기중");
    }
    set statePrepare(value: boolean) {
        this._setState(value, "대기중");
    }

    get stateComplete(): boolean {
        return ManagerFilter.states.includes("예약완료");
    }
    set stateComplete(value: boolean) {
        this._setState(value, "예약완료");
    }

    get stateCancel(): boolean {
        return ManagerFilter.states.includes("취소");
    }
    set stateCancel(value: boolean) {
        this._setState(value, "취소");
    }

    _setState(toggle: boolean, value: string) {
        if (toggle) {
            ManagerFilter.states.push(value);
        } else {
            ManagerFilter.states = ManagerFilter.states.filter((item) => item !== value);
        }
    }

    initFilterAndList() {
        ManagerFilter = JSON.parse(JSON.stringify(initFilter));
        this.filter = ManagerFilter;
        this.setList();
    }

    applyFilter() {
        this.setList();
    }

    private async setList() {
        let result: Table[] = [];
        const db = this._getFilteredDB();

        db.forEach((model) => {
            let item: Table = {
                id: model.id,
                visit: false,
                date: `${model["날짜"].slice(5)} ${model["시간"]}시`,
                type: model["예약유형"],
                name: `${model["성함"]}(${model["인원"]})`,
                status: model["상태"],
                order: this._getOrder(model),
                memo: this._getMemo(model),
            };
            result.push(item);
        });
        this.dataSource = new MatTableDataSource(result);
        this.dataSource.sort = this.sort;
    }

    private _sortList(a: IReservationForm, b: IReservationForm) {
        // 1) "날짜"가 빠를수록 정렬
        const dateA = new Date(a["날짜"]);
        const dateB = new Date(b["날짜"]);
        if (dateA < dateB) {
            return -1;
        }
        if (dateA > dateB) {
            return 1;
        }

        // 2) "상태"가 "대기중" > "예약완료" > "취소" 순서로 정렬
        const statusOrder = {
            대기중: 0,
            예약완료: 1,
            취소: 2,
        };
        const statusA = statusOrder[a["상태"]];
        const statusB = statusOrder[b["상태"]];
        if (statusA < statusB) {
            return -1;
        }
        if (statusA > statusB) {
            return 1;
        }

        return 0; // 동일한 경우 유지
    }

    private _getFilteredDB(): IDBService[] {
        let db: IDBService[] = JSON.parse(JSON.stringify(this.db));
        if (this.filter.date[0]) {
            db = db.filter((v) => Moment(v["날짜"]) >= this.filter.date[0]);
        }
        if (this.filter.date[1]) {
            db = db.filter((v) => Moment(v["날짜"]) <= this.filter.date[1]);
        }
        if (this.filter.states.length > 0) {
            db = db.filter((v) => this.filter.states.includes(v["상태"]));
        }
        return db;
    }

    private _getOrder(model: IReservationForm): string {
        let order: string = "";
        if (model["평상"]) {
            order += `평상:${model["평상"]},`;
        }
        if (model["테이블"]) {
            order += `데크:${model["테이블"]},`;
        }
        if (model["능이백숙"]) {
            order += `능이:${model["능이백숙"]},`;
        }
        if (model["백숙"]) {
            order += `한방:${model["백숙"]},`;
        }
        if (model["버섯찌개"]) {
            order += `버섯:${model["버섯찌개"]},`;
        }
        if (model["버섯찌개2"]) {
            order += `버섯2인:${model["버섯찌개2"]},`;
        }
        return order;
    }

    private _getMemo(model: IReservationForm): string {
        let memo: string = `${model["메모"]} / ${model["전화번호"]} / `;
        for (let car of model["차량번호"]) {
            memo += `${car},`;
        }
        return memo;
    }
}
