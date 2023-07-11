import { Component, OnInit, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ReservationService } from "reservation/service/reservation.service";
import * as Moment from "moment";
import { DBService, IUserDB } from "reservation/service/DB.service";
import { MatDialog } from "@angular/material/dialog";
import { ReservationDialogComponent } from "reservation/reservation-dialog/reservation-dialog.component";

interface Table {
    id?: string;
    date?: string;
    type?: "평상" | "식사" | "객실";
    name?: string;
    status?: string;
    order?: string;
    memo?: string;
    money?: number;
    checked?: boolean;
    tel?: string;
    cars?: string;
    managerMemo?: string;
    changeMode?: Table;
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
export class ManagerTableComponent implements OnInit {
    @ViewChild(MatSort) sort: MatSort;
    displayedColumns: string[] = [
        "checked",
        "status",
        "date",
        "type",
        "name",
        "order",
        "more",
        "car",
        "tel",
        "managerMemo",
        "memo",
    ];
    dataSource: MatTableDataSource<any>;
    db: IUserDB[] = [];
    filter = ManagerFilter;
    editMode: boolean = false;
    deleteMode: boolean = false;
    checkMode: boolean = true;
    SMSMode: boolean = false;
    totalChecked: boolean = false;

    constructor(
        private DBService: DBService,
        private reservationService: ReservationService,
        private dialog: MatDialog
    ) {
        this.DBService.customerDB$.subscribe((db) => {
            this.db = db as IUserDB[];
            this.db.sort((a, b) => this._sortList(a, b));
            this.setList();
        });
        this.filter = ManagerFilter;
    }

    ngOnInit(): void {
        this._setCheckTable();

        if (!this.isMobile()) {
            this.displayedColumns = this.displayedColumns.filter((v) => v !== "more");
        }
    }

    isMobile(): boolean {
        const userAgent = window.navigator.userAgent || "";
        return userAgent.includes("Mobile") && !userAgent.includes("iPad") && !userAgent.includes("tablet");
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
                date: this._getDate(model),
                type: model["예약유형"],
                name: `${model["성함"]}(${model["인원"] ? model["인원"] : "?"})`,
                status: model["상태"],
                order: this._getOrder(model),
                memo: model["메모"],
                cars: this._getCars(model),
                tel: model["전화번호"],
                money: model["입금확인"] ? 0 : this.reservationService.getReservationCost(model),
                checked: false,
                managerMemo: model["관리자메모"],
            };
            if (model["수정내용"]) {
                item.changeMode = {};
                if (model["수정내용"]["예약일"]) {
                    item.changeMode.date = Moment(model["수정내용"]["예약일"]).format("M/D");
                }
                if (model["수정내용"]["예약시간"]) {
                    item.changeMode.date = model["수정내용"]["예약일"]
                        ? `${Moment(model["수정내용"]["예약일"]).format("M/D")} ${model["수정내용"]["예약시간"]}시`
                        : `${Moment(model["예약일"]).format("M/D")} ${model["예약시간"]}시`;
                }
                if (model["수정내용"]["예약유형"]) {
                    item.changeMode.type = model["수정내용"]["예약유형"];
                }
                if (model["수정내용"]["성함"] || model["수정내용"]["인원"]) {
                    item.changeMode.name = `${model["수정내용"]["성함"] ? model["수정내용"]["성함"] : model["성함"]}(${
                        model["수정내용"]["인원"] ? model["수정내용"]["인원"] : model["인원"]
                    })`;
                }
                if (model["수정내용"]["상태"]) {
                    item.changeMode.status = model["수정내용"]["상태"];
                }
                if (
                    model["수정내용"]["평상"] >= 0 ||
                    model["수정내용"]["테이블"] >= 0 ||
                    model["수정내용"]["능이백숙"] >= 0 ||
                    model["수정내용"]["백숙"] >= 0 ||
                    model["수정내용"]["버섯찌개"] >= 0 ||
                    model["수정내용"]["버섯찌개2"] >= 0
                ) {
                    item.changeMode.order = this._getChangedOrder(model);
                }
                if (model["수정내용"]["메모"]) {
                    item.changeMode.memo = model["수정내용"]["메모"];
                }
                if (model["수정내용"]["차량번호"]) {
                    item.changeMode.cars = this._getCars(model["수정내용"]);
                }
                if (model["수정내용"]["전화번호"]) {
                    item.changeMode.tel = model["수정내용"]["전화번호"];
                }
                if (model["수정내용"]["관리자메모"]) {
                    item.changeMode.managerMemo = model["수정내용"]["관리자메모"];
                }
            }
            result.push(item);
        });
        this.dataSource = new MatTableDataSource(result);
        this.dataSource.sort = this.sort;
    }

    private _sortList(a: IUserDB, b: IUserDB) {
        // 1) "날짜"가 빠를수록 정렬
        const dateA = new Date(a["예약일"]);
        const dateB = new Date(b["예약일"]);
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

    private _getFilteredDB(): IUserDB[] {
        let db: IUserDB[] = JSON.parse(JSON.stringify(this.db));
        if (this.filter.date[0]) {
            db = db.filter((v) => v["만료일"] >= this.filter.date[0].format("YYYY-MM-DD"));
        }
        if (this.filter.date[1]) {
            db = db.filter((v) => Moment(v["만료일"]) <= this.filter.date[1]);
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

    private _getDate(model: IUserDB): string {
        const startDate = Moment(model["예약일"]);

        let dateText: string = startDate.format("M/D");
        if (model["이용박수"]) {
            const endDate = Moment(model["예약일"]).add(model["이용박수"], "days");
            dateText = `${dateText}~${endDate.format(startDate.month() === endDate.month() ? "D" : "M/D")}(${
                model["이용박수"]
            })`;
        }
        if (model["예약시간"]) {
            dateText = `${dateText} ${model["예약시간"]}시`;
        }
        return dateText;
    }

    private _getChangedOrder(model: IUserDB | any): string {
        let changed: IUserDB | any = model["수정내용"];
        if (
            changed["평상"] >= 0 ||
            changed["테이블"] >= 0 ||
            changed["능이백숙"] >= 0 ||
            changed["백숙"] >= 0 ||
            changed["버섯찌개"] >= 0 ||
            changed["버섯찌개2"] >= 0
        ) {
            for (let item of ["평상", "테이블", "능이백숙", "백숙", "버섯찌개", "버섯찌개2"]) {
                changed[item] = changed[item] >= 0 ? changed[item] : model[item];
            }
        }

        return this._getOrder(changed);
    }

    private _getOrder(model: IUserDB): string {
        let order: string = "";
        if (model["객실"]) {
            order += `${model["객실"]}, `;
        }
        if (model["평상"] !== null && model["평상"] >= 0) {
            order += `평상:${model["평상"]}, `;
        }
        if (model["테이블"] !== null && model["테이블"] >= 0) {
            order += `데크:${model["테이블"]}, `;
        }
        if (model["능이백숙"] !== null && model["능이백숙"] >= 0) {
            order += `능이:${model["능이백숙"]}, `;
        }
        if (model["백숙"] !== null && model["백숙"] >= 0) {
            order += `한방:${model["백숙"]}, `;
        }
        if (model["버섯찌개"] !== null && model["버섯찌개"] >= 0) {
            order += `버섯:${model["버섯찌개"]}, `;
        }
        if (model["버섯찌개2"] !== null && model["버섯찌개2"] >= 0) {
            order += `버섯2인:${model["버섯찌개2"]}, `;
        }
        return order;
    }

    private _getCars(model: IUserDB): string {
        let cars: string = "";
        if (model["차량번호"]) {
            model["차량번호"].forEach((car) => {
                cars += `${car}, `;
            });
        }
        return cars;
    }

    clickStatus(element: any, status: any) {
        let model = this.db.filter((v) => v.id === element.id)[0];
        model["상태"] = status;
        if (["예약", "방문"].includes(status)) {
            model["입금확인"] = true;
        }
        this.DBService.set(model);
    }

    async clickTable(element: any) {
        if (this.editMode) {
            let model = JSON.parse(JSON.stringify(this.db.filter((v) => v.id === element.id)[0]));
            this.reservationService.formData$.next(model);
            this.reservationService.bookingStep$.next(1);
            this.dialog.open(ReservationDialogComponent);
        } else if (this.deleteMode || this.SMSMode) {
            element.checked = !element.checked;
            this.updateTotalChecked(element);
        }
    }

    addForm() {
        this.reservationService.formData$.next({ 상태: "대기" });
        this.reservationService.bookingStep$.next(1);
        this.dialog.open(ReservationDialogComponent);
    }

    changeDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this._setCheckTable();
    }

    deleteForm() {
        this.dataSource.data
            .filter((v: Table) => v.checked)
            .forEach((v: Table) => {
                this.DBService.delete(v.id);
            });
        this.deleteMode = false;
        this._setCheckTable();
    }

    changeSMSMode() {
        this.SMSMode = !this.SMSMode;
        this._setCheckTable();
    }

    clickMoney(element: any) {
        let model = this.db.filter((v) => v.id === element.id)[0];
        model["입금확인"] = true;
        this.DBService.edit(model);
    }

    telList(): string {
        let tels = "";
        this.dataSource.filteredData.forEach((filteredData) => {
            const data = this.db.filter((originalData) => originalData.id === filteredData.id);
            if (data[0]) {
                tels += data[0]["전화번호"] + ",";
            }
        });
        return tels;
    }

    updateAllDataChecked(value?: boolean) {
        if (this.dataSource) {
            this.dataSource.data = this.dataSource.data.map((v: Table) => {
                return {
                    ...v,
                    checked: value ? value : this.totalChecked,
                };
            });
        }
    }

    updateTotalChecked(element: Table) {
        if (!element.checked) {
            this.totalChecked = false;
        } else {
            this.totalChecked = this.dataSource.data.filter((v: Table) => !v.checked).length === 0;
        }
    }

    get selectedNumber(): number {
        if (this.dataSource) {
            return this.dataSource.data.filter((v: Table) => v.checked).length;
        }
        return 0;
    }

    private _setCheckTable() {
        this.checkMode = !this.checkMode;
        this.totalChecked = false;
        if (this.displayedColumns.includes("checked")) {
            this.displayedColumns = this.displayedColumns.filter((v) => v !== "checked");
        } else {
            this.displayedColumns.unshift("checked");
        }
        this.updateAllDataChecked(false);
    }

    sendSMSToGuests(type?: "BeforeVisit" | "Account" | "Confirm" | "Booking") {
        let tels: string[] = [];
        this.dataSource.data
            .filter((v: Table) => v.checked)
            .forEach((v: Table) => {
                tels.push(v.tel);
            });

        let url = `sms:${tels}`;

        if (type === "BeforeVisit") {
            url += `?body=${encodeURIComponent(
                SMSTextBeforeVisit.replace("NAME님 ", "").replace("URIRESOURCE", "type=search")
            )}`;
        } else if (type === "Confirm") {
            url += `?body=${encodeURIComponent(
                SMStextForConfirm.replace("NAME님 ", "").replace("TYPE ", "").replace("URIRESOURCE", "type=search")
            )}`;
        } else if (type === "Account") {
            url += `?body=${encodeURIComponent(
                SMStextForAccount.replace("NAME님 ", "").replace("- 예약금: MONEY원", "")
            )}`;
        } else if (type === "Booking") {
            url += `?body=${encodeURIComponent(SMStextForBooking)}`;
        }

        location.href = url;

        this.SMSMode = false;
        this._setCheckTable();
    }

    getSMSText(element: Table, type?: "BeforeVisit" | "Account" | "Confirm"): string {
        if (type === "Account") {
            return encodeURIComponent(
                SMStextForAccount.replace("NAME", element.name).replace("MONEY", String(element.money))
            );
        } else if (type === "BeforeVisit") {
            return encodeURIComponent(
                SMSTextBeforeVisit.replace("NAME", element.name).replace("URIRESOURCE", `id=${element.id}`)
            );
        } else if (type === "Confirm") {
            return encodeURIComponent(
                SMStextForConfirm.replace("NAME", element.name)
                    .replace("TYPE", String(element.type))
                    .replace("URIRESOURCE", `id=${element.id}`)
            );
        }
        return "";
    }
}

const SMSTextBeforeVisit = `NAME님 안녕하세요. 능운대펜션입니다. 방문일이 다가와 연락드립니다.
필요한 경우, 아래 링크에 접속하시어 <차량등록>, <식사예약> 등 사전 정보를 입력해주시기 바랍니다.
https://hwayanghotel.github.io/#/reservation?URIRESOURCE
감사합니다.`;

const SMStextForAccount = `NAME님 안녕하세요. 능운대펜션입니다. 예약을 위한 입금 정보를 안내드립니다.
입금 순서로 예약이 완료되며, 확인 후 연락드리겠습니다. 감사합니다.
- 입금계좌: 농협 352-0370-5919-43 (예금주: 정경미)
- 예약금: MONEY원`;

const SMStextForConfirm = `NAME님 안녕하세요. 능운대펜션입니다. TYPE 예약 확정되어 안내드립니다.
필요한 경우, 아래 링크에 접속하시어 <차량등록>, <식사예약> 등 사전 정보를 입력해주시기 바랍니다.
https://hwayanghotel.github.io/#/reservation?URIRESOURCE
감사합니다.`;

const SMStextForBooking = `안녕하세요. 능운대펜션입니다.
아래 링크를 통해 <객실>, <평상>, <식사> 예약이 가능합니다.
공원 내 입차를 희망하시면, <차량정보>도 함께 적어주세요!
https://hwayanghotel.github.io/#/reservation
감사합니다.`;
