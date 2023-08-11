import { Injectable } from "@angular/core";
import { Moment } from "moment";
import { DBService } from "reservation/service/DB.service";
import { ReplaySubject } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class ManagerService {
    controlFilter: ReplaySubject<Moment> = new ReplaySubject<Moment>();
    permission: boolean = false;
    private answer = 828;

    constructor(private DBService: DBService) {}

    checkPermission(password: number) {
        if (!this.permission && password === this.answer) {
            this.permission = true;
            this.DBService.subscribeUserDB();
        }
    }
}
