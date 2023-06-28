import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTabGroup } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: "manager",
    templateUrl: "./manager.component.html",
})
export class ManagerComponent implements OnInit {
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    permission: boolean = false;

    constructor(private route: ActivatedRoute) {}

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
