import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";
import { ManagerService } from "manager/manager.service";
import { DBService, IDBService } from "reservation/service/DB.service";

@Component({
    selector: "manager",
    templateUrl: "./manager.component.html",
    styleUrls: ["./manager.component.scss"],
})
export class ManagerComponent implements OnInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    open: boolean = true;
    today = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
    nyBaeksuk = 0;
    baeksuk = 0;
    mushroom = 0;
    mushroom2 = 0;
    cars = 0;
    guests = 0;

    constructor(private route: ActivatedRoute, private DBService: DBService, private managerService: ManagerService) {
        this.DBService.firebaseStore$.subscribe((db) => {
            const dailyData = db.filter((v) => v["날짜"] === this.today);
            this._setIndicators(dailyData);
        });
    }

    private _setIndicators(dailyData: IDBService[]) {
        this.nyBaeksuk = 0;
        this.baeksuk = 0;
        this.mushroom = 0;
        this.mushroom2 = 0;
        this.cars = 0;
        this.guests = 0;
        dailyData.forEach((data) => {
            this.nyBaeksuk += data["능이백숙"];
            this.baeksuk += data["백숙"];
            this.mushroom += data["버섯찌개"];
            this.mushroom2 += data["버섯찌개2"];
            this.cars += data["차량번호"].length;
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
