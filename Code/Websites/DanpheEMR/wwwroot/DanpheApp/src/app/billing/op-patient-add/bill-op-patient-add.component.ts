import { Component, ChangeDetectorRef, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { CoreService } from '../../core/shared/core.service';
import { CommonFunctions } from '../../shared/common.functions';
import { DanpheHTTPResponse } from '../../shared/common-models';
import * as moment from 'moment/moment';
import { BillingBLService } from '../shared/billing.bl.service';
import { PatientService } from '../../patients/shared/patient.service';
import { PatientsBLService } from '../../patients/shared/patients.bl.service';
import { CountrySubdivision } from '../../settings/shared/country-subdivision.model';
import { BillingOpPatientVM } from './bill-op-patientVM';
import { DanpheCache, MasterType } from '../../shared/danphe-cache-service-utility/cache-services';
import { UnicodeService } from '../../common/unicode.service';
import { Router } from '@angular/router';

@Component({
  selector: 'bill-op-patient-add',
  templateUrl: './bill-op-patient-add.html',
  styles: [`padding-7-tp{padding-top: 7px;}`]
})

// App Component class
export class BillOutpatientAddComponent {

  public newPatient: BillingOpPatientVM = new BillingOpPatientVM();

  public Country_All: any = null;
  public districts_All: Array<CountrySubdivision> = [];
  public districts_Filtered: Array<CountrySubdivision> = [];
  public selectedDistrict: CountrySubdivision = new CountrySubdivision();
  public olderAddressList: Array<any> = [];

  public loading: boolean = false;
  public GoToBilling: boolean = false;

  @Output() public callBackAddClose: EventEmitter<Object> = new EventEmitter<Object>();


  constructor(public changeDetector: ChangeDetectorRef,
    public msgBoxServ: MessageboxService,
    public patientBlService: PatientsBLService,
    public coreService: CoreService,
    public patientService: PatientService,
    public billingBLService: BillingBLService,
    public unicode: UnicodeService,
    public router: Router,
  ) {

    this.Initialize();

  }

  ngOnInit() {
    let country = this.coreService.GetDefaultCountry();
    let subDivision = this.coreService.GetDefaultCountrySubDivision();
    this.newPatient.CountryId = country ? country.CountryId : null;
    this.selectedDistrict.CountrySubDivisionId = this.newPatient.CountrySubDivisionId = subDivision ? subDivision.CountrySubDivisionId : null;
    this.selectedDistrict.CountrySubDivisionName = this.newPatient.CountrySubDivisionName = subDivision ? subDivision.CountrySubDivisionName : null;
  }


  public Initialize() {
    this.Country_All = DanpheCache.GetData(MasterType.Country, null);
    this.districts_All = DanpheCache.GetData(MasterType.SubDivision, null);


    if (this.coreService.Masters.UniqueDataList && this.coreService.Masters.UniqueDataList.UniqueAddressList) {
      this.olderAddressList = this.coreService.Masters.UniqueDataList.UniqueAddressList;
    }

  }

  public districtListFormatter(data: any): string {
    let html = data["CountrySubDivisionName"];
    return html;
  }

  public AssignSelectedDistrict() {
    if (this.selectedDistrict && this.selectedDistrict.CountrySubDivisionId) {
      this.newPatient.CountrySubDivisionId = this.selectedDistrict.CountrySubDivisionId;
      this.newPatient.CountrySubDivisionName = this.selectedDistrict.CountrySubDivisionName;
    }
  }

  public CountryDDL_OnChange() {
    this.districts_Filtered = this.districts_All.filter(c => c.CountryId == this.newPatient.CountryId);
  }

  public CalculateDob() {
    this.newPatient.DateOfBirth = this.patientService.CalculateDOB(Number(this.newPatient.Age), this.newPatient.AgeUnit);
  }



  CheckValiadtionAndRegisterNewPatient(goToBilling: boolean) {
    this.GoToBilling = goToBilling;
    if (this.loading) {
      for (var i in this.newPatient.OutPatientValidator.controls) {
        this.newPatient.OutPatientValidator.controls[i].markAsDirty();
        this.newPatient.OutPatientValidator.controls[i].updateValueAndValidity();
      }
      if (this.newPatient.IsValid(undefined, undefined)) {
        this.CheckExistingPatientsAndSubmit();
      }
    }
    this.loading = false;
  }

  public matchedPatientList: any;
  public showExstingPatientListPage: boolean = false;

  public CheckExistingPatientsAndSubmit() {
    if (!this.newPatient.PatientId) {
      this.billingBLService.GetExistedMatchingPatientList(this.newPatient.FirstName, this.newPatient.LastName, this.newPatient.PhoneNumber)
        .subscribe(res => {
          if (res.Status == "OK" && res.Results.length) {
            this.matchedPatientList = res.Results;
            this.showExstingPatientListPage = true;
            this.loading = false;
          }
          else {
            this.RegisterNewPatient();
          }
        });
    }
    else {
      this.RegisterNewPatient();
    }

  }

  RegisterNewPatient() {
    this.ConcatinateAgeAndUnit();

    this.billingBLService.AddNewOutpatienPatient(this.newPatient)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {

          if (this.GoToBilling) {
            this.callBackAddClose.emit({ action: "register-and-billing", data: res.Results, close: true });
          }
          else {
            this.callBackAddClose.emit({ action: "register-only", data: res.Results, close: true });
          }


        }
        else {
          this.msgBoxServ.showMessage('failed', ["Failed to add new Patient. Please try later !"]);
          this.loading = false;
        }
      });
  }

  //we're storing Age and Age unit in a single column.
  public ConcatinateAgeAndUnit() {
    if (this.newPatient.Age && this.newPatient.AgeUnit) {
      this.newPatient.Age = this.newPatient.Age + this.newPatient.AgeUnit;
    }
  }

  public CloseAddNewPatPopUp() {
    this.callBackAddClose.emit({ close: true });
  }

  translate(language) {
    this.unicode.translate(language);
    if (language == "english") {
      var localName = <HTMLInputElement>document.getElementById("patNameLocal");
      let ipLocalName = localName.value;
      this.newPatient.PatientNameLocal = ipLocalName.length > 0 ? ipLocalName : "";
    }
  }
  //if the user selects any patient from the matched list of patient. assign it to current patient instead of creating a new patient.
  AssignMatchedPatientAndProceed(PatientId) {
    let existingPatient = this.matchedPatientList.find(a => a.PatientId == PatientId);
    existingPatient.CountrySubDivisionName = this.districts_All.find(a => a.CountrySubDivisionId == existingPatient.CountrySubDivisionId).CountrySubDivisionName;
    this.callBackAddClose.emit({ action: "register-and-billing", data: existingPatient, close: true });
    //this.billingBLService.GetPatientById(PatientId)
    //  .subscribe(res => {
    //    if (res.Status == 'OK') {
    //      //patient Service has Common SetPatient method For Setting Pattient Deatils 
    //      //this common method is for Code reusability
    //      this.loading = false;
    //      this.patientService.setGlobal(res.Results),

    //        //this showExstingPatientList is false because popup window should be closed after navigate to /Patient/RegisterPatient/BasicInfo in set patient method of Patient service
    //        this.showExstingPatientListPage = false;

    //      //go to route if all the value are mapped with the patient service
    //      this.router.navigate(['/Patient/RegisterPatient/BasicInfo']);
    //    }
    //    else {
    //      // alert(res.ErrorMessage);
    //      this.msgBoxServ.showMessage("error", [res.ErrorMessage]);

    //    }
    //  },


    //    err => {
    //      this.msgBoxServ.showMessage("error", ["failed to get selected patient"]);
    //      //alert('failed to get selected patient');

    //    });

  }

  emitCloseAction($event) {
    var action = $event.action;
    var data = $event.data;

    if (action == "use-existing") {
      let patientId = data;
      this.AssignMatchedPatientAndProceed(patientId); //Match Existing Patient and process
    }
    else if (action == "add-new") {
      this.RegisterNewPatient();
    }
    else if (action == "close") {
      this.showExstingPatientListPage = false;
    }
    this.loading = false;
  }
}
