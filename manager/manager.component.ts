import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";
import { ManagerService } from "manager/manager.service";
import { DBService, IUserDB } from "reservation/service/DB.service";
import * as Moment from "moment";
import { UploaderService } from "reservation/service/uploader.service";
import { MatDialog } from "@angular/material/dialog";
import { debounceTime } from "rxjs";

@Component({
    selector: "manager",
    templateUrl: "./manager.component.html",
    styleUrls: ["./manager.component.scss"],
})
export class ManagerComponent implements OnInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    @ViewChild("CalendarDialog") CalendarDialog: TemplateRef<any>;
    open: boolean = true;
    selectedDate = Moment();
    nyBaeksuk = 0;
    baeksuk = 0;
    mushroom = 0;
    mushroom2 = 0;
    cars = 0;
    visitedCars = 0;
    guests = 0;
    guestRoom = 0;
    guestFlatBench = 0;
    guestFood = 0;

    customerDB: IUserDB[] = [];

    constructor(
        private route: ActivatedRoute,
        private DBService: DBService,
        private managerService: ManagerService,
        private uploader: UploaderService,
        private dialog: MatDialog
    ) {
        this.DBService.customerDB$.pipe(debounceTime(300)).subscribe((db) => {
            this.customerDB = db;
            this._setCalenderDB();
            this.setIndicators();
        });
        // setTimeout(() => {
        //     this.uploader.uploadPensionDB(true);
        //     this.uploader.uploadOtherBookingInfo(true);
        // }, 5000);
    }

    private _setCalenderDB() {
        if (this.customerDB.length && !this._needToUpdate) {
            this._needToUpdate = true;
            setTimeout(() => {
                this.uploader.uploadCalenderDB();
                this._needToUpdate = false;
            }, 5000);
        }
    }
    private _needToUpdate: boolean = false;

    get showSelectedDate(): string {
        return this.selectedDate.format("YY-MM-DD");
    }

    setIndicators() {
        const dailyData = this.customerDB
            .filter((v) => v["예약일"] === this.selectedDate.format("YYYY-MM-DD"))
            .filter((v) => ["예약", "방문", "완료"].includes(v["상태"]));

        this.nyBaeksuk = 0;
        this.baeksuk = 0;
        this.mushroom = 0;
        this.mushroom2 = 0;
        this.cars = 0;
        this.visitedCars = 0;
        this.guests = 0;
        this.guestRoom = 0;
        this.guestFlatBench = 0;
        this.guestFood = 0;
        dailyData.forEach((data) => {
            this.nyBaeksuk += data["능이백숙"] | 0;
            this.baeksuk += data["백숙"] | 0;
            this.mushroom += data["버섯찌개"] | 0;
            this.mushroom2 += data["버섯찌개2"] | 0;
            this.cars += data["차량번호"] ? data["차량번호"].length : 0;
            this.visitedCars += data["차량방문"] ? data["차량방문"].filter((v) => v).length : 0;
            this.guestRoom += Number(data["예약유형"] === "객실");
            this.guestFlatBench += Number(data["예약유형"] === "평상");
            this.guestFood += Number(data["예약유형"] === "식사");
            this.guests++;
        });
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe((params) => {
            const id = params.get("id");
            if (id) {
                this.managerService.checkPermission(Number(id));
            }
        });
    }

    get permission(): boolean {
        return this.managerService.permission;
    }

    get password(): number {
        return this._password;
    }

    set password(value: number) {
        this._password = value;
        this.managerService.checkPermission(value);
    }
    private _password: number;

    selectTab() {
        this.tabGroup.selectedIndex = 1;
    }

    openCalendarDialog() {
        this.dialog.open(this.CalendarDialog);
    }
}
