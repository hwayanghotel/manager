import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class ManagerService {
    permission: boolean = false;
    private answer = 828;

    checkPermission(password: number) {
        if (password === this.answer) {
            this.permission = true;
        }
    }
}
