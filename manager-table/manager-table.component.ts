import { Component, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { IReservationForm, ReservationService } from "reservation/service/reservation.service";
import * as Moment from "moment";

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

@Component({
    selector: "manager-table",
    templateUrl: "./manager-table.component.html",
})
export class ManagerTableComponent {
    @ViewChild(MatSort) sort: MatSort;
    displayedColumns: string[] = ["visit", "date", "type", "name", "status", "order", "memo"];
    dataSource: MatTableDataSource<any>;

    startDate: Moment.Moment;
    endDate: Moment.Moment;

    constructor(private reservationService: ReservationService) {
        this.setList();
        this.reservationService.formData$.subscribe((form) => {
            if (form["날짜"]) {
                this.startDate = this.endDate = Moment(form["날짜"]);
            }
        });
    }

    private async setList() {
        let list = await this.reservationService.search(undefined, ["날짜", "상태"]);
        let result: Table[] = [];
        list.sort((a, b) => this._sortList(a, b));
        list.forEach((model) => {
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

    _getOrder(model: IReservationForm): string {
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
