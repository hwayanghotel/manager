import { Injectable } from "@angular/core";
import { DBService } from "reservation/service/DB.service";

@Injectable({
    providedIn: "root",
})
export class ManagerService {
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
