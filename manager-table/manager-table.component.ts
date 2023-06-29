import { Component, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { IReservationForm, ReservationService } from "reservation/service/reservation.service";
import * as Moment from "moment";
import { DBService, IDBService } from "reservation/service/DB.service";
import { MatDialog } from "@angular/material/dialog";
import { ReservationDialogComponent } from "reservation/reservation-dialog/reservation-dialog.component";

interface Table {
    id: string;
    date: string;
    type: "평상" | "식사" | "객실";
    name: string;
    status: string;
    order: string;
    memo: string;
    money: number;
}

interface Filter {
    open: boolean;
    date: Moment.Moment[];
    states: string[];
    tel: number;
    name: string;
    car: string;
}

const initFilter: Filter = {
    open: false,
    date: [Moment(Moment().format("YYYY-MM-DD")), undefined],
    states: ["대기", "수정", "예약", "방문"],
    tel: undefined,
    name: undefined,
    car: undefined,
};
export let ManagerFilter: Filter = JSON.parse(JSON.stringify(initFilter));
ManagerFilter.date[0] = Moment(ManagerFilter.date[0]);

@Component({
    selector: "manager-table",
    templateUrl: "./manager-table.component.html",
    styleUrls: ["./manager-table.component.scss"],
})
export class ManagerTableComponent {
    @ViewChild(MatSort) sort: MatSort;
    displayedColumns: string[] = ["status", "date", "type", "name", "order", "memo"];
    dataSource: MatTableDataSource<any>;
    db: IDBService[] = [];
    filter = ManagerFilter;
    editMode: boolean = false;
    deleteMode: boolean = false;
    deleteList: string[] = [];

    constructor(
        private DBService: DBService,
        private reservationService: ReservationService,
        private dialog: MatDialog
    ) {
        this.DBService.firebaseStore$.subscribe((db) => {
            this.db = db as IDBService[];
            this.db.sort((a, b) => this._sortList(a, b));
            this.setList();
        });
        this.filter = ManagerFilter;
    }

    get statePrepare(): boolean {
        return ManagerFilter.states.includes("대기");
    }
    set statePrepare(value: boolean) {
        this._setState(value, "대기");
    }

    get stateEdit(): boolean {
        return ManagerFilter.states.includes("수정");
    }
    set stateEdit(value: boolean) {
        this._setState(value, "수정");
    }

    get stateComplete(): boolean {
        return ManagerFilter.states.includes("예약");
    }
    set stateComplete(value: boolean) {
        this._setState(value, "예약");
    }

    get stateVisited(): boolean {
        return ManagerFilter.states.includes("방문");
    }
    set stateVisited(value: boolean) {
        this._setState(value, "방문");
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
        ManagerFilter.date[0] = Moment(ManagerFilter.date[0]);

        this.filter = ManagerFilter;
        this.setList();
    }

    applyFilter() {
        this.setList();
    }

    searchInput(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    private async setList() {
        let result: Table[] = [];
        const db = this._getFilteredDB();

        db.forEach((model) => {
            let item: Table = {
                id: model.id,
                date: model["시간"] ? `${model["날짜"].slice(5)} ${model["시간"]}시` : `${model["날짜"].slice(5)}`,
                type: model["예약유형"],
                name: `${model["성함"]}(${model["인원"]})`,
                status: model["상태"],
                order: this._getOrder(model),
                memo: this._getMemo(model),
                money: model["입금확인"] ? 0 : this.reservationService.getReservationCost(model),
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

        // 2) "상태"가 "대기" > "수정" > "예약" > "방문" > "취소" 순서로 정렬
        const statusOrder = {
            대기: 0,
            수정: 1,
            예약: 2,
            방문: 3,
            취소: 4,
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
            db = db.filter((v) => v["날짜"] >= this.filter.date[0].format("YYYY-MM-DD"));
        }
        if (this.filter.date[1]) {
            db = db.filter((v) => Moment(v["날짜"]) <= this.filter.date[1]);
        }
        if (this.filter.states.length > 0) {
            db = db.filter((v) => this.filter.states.includes(v["상태"]));
        }
        if (this.filter.name) {
            db = db.filter((v) => v["성함"].includes(this.filter.name));
        }
        if (this.filter.tel) {
            db = db.filter((v) => v["전화번호"].replace(/-/g, "").includes(String(this.filter.tel)));
        }
        if (this.filter.car) {
            db = db.filter((v) => {
                for (let car of v["차량번호"]) {
                    if (car.includes(this.filter.car)) {
                        return true;
                    }
                }
                return false;
            });
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
        let memo: string = "";
        if (model["메모"]) {
            memo += `${model["메모"]} / `;
        }
        memo += `${model["전화번호"]} / `;
        for (let car of model["차량번호"]) {
            memo += `${car},`;
        }
        return memo;
    }

    async clickStatus(element: any, status: any) {
        let model = (await this.reservationService.search(element.id))[0];
        model["상태"] = status;
        if (["예약", "방문"].includes(status)) {
            model["입금확인"] = true;
        }
        this.DBService.edit(model);
    }

    async clickTable(element: any) {
        if (this.editMode) {
            let model = (await this.reservationService.search(element.id))[0];
            this.reservationService.setReservationForm(model);
            this.reservationService.bookingStep$.next(1);
            this.dialog.open(ReservationDialogComponent);
        }
        if (this.deleteMode) {
            this.deleteList.push(element.id);
        }
    }

    addForm() {
        this.reservationService.setReservationForm(
            {
                상태: "대기",
            },
            true
        );
        this.reservationService.bookingStep$.next(1);
        this.dialog.open(ReservationDialogComponent);
    }

    changeDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.deleteList = [];
    }

    deleteForm() {
        this.deleteList.forEach((id) => {
            this.DBService.delete(id);
        });
        this.deleteList = [];
        this.deleteMode = false;
    }

    async clickMoney(element: any) {
        let model = (await this.reservationService.search(element.id))[0];
        model["입금확인"] = true;
        this.DBService.edit(model);
        // 입금 확인 테스트 필요함 + 처음에 false 잘 설정되었나?
    }
}
