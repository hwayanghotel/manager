import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";
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
    permission: boolean = false;
    nyBaeksuk = 0;
    baeksuk = 0;
    mushroom = 0;
    mushroom2 = 0;
    cars = 0;
    guests = 0;

    constructor(private route: ActivatedRoute, private DBService: DBService) {
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
                this.password = Number(id);
            }
        });
    }

    get password(): number {
        return this._password;
    }

    set password(value: number) {
        this._password = value;
        this._checkPermission();
    }
    private _password: number;

    private _checkPermission() {
        const answer = 828;
        if (this._password === answer) {
            this.permission = true;
        }
    }

    selectTab() {
        this.tabGroup.selectedIndex = 1;
    }
}
