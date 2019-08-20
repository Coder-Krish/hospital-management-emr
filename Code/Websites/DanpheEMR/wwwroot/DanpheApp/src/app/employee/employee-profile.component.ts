﻿import { Component, Directive, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SecurityService } from '../security/shared/security.service';
import { EmployeeProfile } from './shared/employee-profile.model';
import { Routes, RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { EmployeeService } from "./shared/employee.service";
@Component({

    templateUrl: "../../app/view/employee-view/ChangeProfile.html" // "/EmployeeView/ChangeProfile"
})

export class EmployeeProfileComponent {
    public http: HttpClient;
    public userProfileInfo: EmployeeProfile = new EmployeeProfile();
    public pathToImage: string = null;
    public pathclear: boolean = false;

    constructor(public securityService: SecurityService, _http: HttpClient, public router: Router
        , public employeeService: EmployeeService) {
        this.http = _http;
        this.LoadUserProfile();
    }
    public options =  {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })};
  
    //to load the user data
    LoadUserProfile() {
        var empId = this.securityService.GetLoggedInUser().EmployeeId;
          this.http.get<any>("/api/Employee?empId=" + empId + "&reqType=employeeProfile", this.options)
            .map(res => res)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    this.OnLoadUserProfileSuccess(res);
                }
                else {
                    alert(res.ErrorMessage);
                    this.logError(res.ErrorMessage);
                }
            },
            err => {
                alert('failed to get the data.. please check log for details.');
                this.logError(err.ErrorMessage);
            });
    }


    OnLoadUserProfileSuccess(res) {
        this.userProfileInfo = res.Results;
        this.pathToImage = "\\" + this.userProfileInfo.ImageFullPath;
    }

    //use to change the profile
    @ViewChild("fileInput") fileInput;
    ChangeProfileImage(userProfileInfo: EmployeeProfile): void {
        let empId = userProfileInfo.EmployeeId;
        let userId = this.securityService.GetLoggedInUser().UserId;
        let input = new FormData();
        let file = this.fileInput.nativeElement;
        //if isselected then only go else dont
        if (file.files.length != 0) {
            let profileImage = file.files[0];
            let splitImagetype = profileImage.type.split("/");
            let imageExtension = splitImagetype[1];
            let localFolder: string = "UserProfile\\";
            let fileName: string = userId + "_" + userProfileInfo.UserName + "." + imageExtension;

            input.append("uploads", profileImage, fileName)

          this.http.put<any>("/api/Employee?empId=" + empId, input)
                .map(res => res)
                .subscribe(res => {
                    if (res.Status == 'OK') {
                        this.userProfileInfo.ImageName = res.Results;
                        this.pathToImage = "../../app/fileuploads/UserProfile/" + this.userProfileInfo.ImageName + '?' + new Date().getTime();
                        alert("Image Uploaded successfully...");
                        this.employeeService.ProfilePicSrcPath = this.pathToImage;
                        this.router.navigate(['/Employee/ProfileMain']);

                    }
                },
                err => {
                    alert('failed to get the data.. please check log for details.');
                    this.logError(err.ErrorMessage);
                });


        }
        else {
            alert("First select the image for profile");
        }

    }


    logError(err: any) {
        console.log(err);
    }

}
