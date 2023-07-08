import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";
import { ManagerService } from "manager/manager.service";
import { DBService, IUserDB } from "reservation/service/DB.service";
import * as Moment from "moment";
import { UploaderService } from "reservation/service/uploader.service";

@Component({
    selector: "manager",
    templateUrl: "./manager.component.html",
    styleUrls: ["./manager.component.scss"],
})
export class ManagerComponent implements OnInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    open: boolean = true;
    today = Moment().format("YYYY-MM-DD");
    nyBaeksuk = 0;
    baeksuk = 0;
    mushroom = 0;
    mushroom2 = 0;
    cars = 0;
    guests = 0;

    constructor(
        private route: ActivatedRoute,
        private DBService: DBService,
        private managerService: ManagerService,
        private uploader: UploaderService
    ) {
        this.DBService.customerDB$.subscribe((db) => {
            const dailyData = db
                .filter((v) => v["예약일"] === this.today)
                .filter((v) => ["예약", "방문"].includes(v["상태"]));
            this._setIndicators(dailyData);

            // setTimeout(() => {
            //     this.uploader.uploadPensionDB(false);
            // }, 5000);
        });
    }

    private _setIndicators(dailyData: IUserDB[]) {
        this.nyBaeksuk = 0;
        this.baeksuk = 0;
        this.mushroom = 0;
        this.mushroom2 = 0;
        this.cars = 0;
        this.guests = 0;
        dailyData.forEach((data) => {
            this.nyBaeksuk += data["능이백숙"] ? data["능이백숙"] : 0;
            this.baeksuk += data["백숙"] ? data["백숙"] : 0;
            this.mushroom += data["버섯찌개"] ? data["버섯찌개"] : 0;
            this.mushroom2 += data["버섯찌개2"] ? data["버섯찌개2"] : 0;
            this.cars += data["차량번호"] && data["차량번호"].length ? data["차량번호"].length : 0;
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
}
