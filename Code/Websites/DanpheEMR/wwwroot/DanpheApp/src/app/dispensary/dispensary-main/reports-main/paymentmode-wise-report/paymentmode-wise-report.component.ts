import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../../core/shared/core.service';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import PHRMGridColumns from '../../../../pharmacy/shared/phrm-grid-columns';
import { ReportingService } from '../../../../reporting/shared/reporting-service';
import { SecurityService } from '../../../../security/shared/security.service';
import { SettingsBLService } from '../../../../settings-new/shared/settings.bl.service';
import { NepaliCalendarService } from '../../../../shared/calendar/np/nepali-calendar.service';
import { CommonFunctions } from '../../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from '../../../../shared/dl.service';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { DispensaryService } from '../../../shared/dispensary.service';

@Component({
  selector: 'app-paymentmode-wise-report',
  templateUrl: './paymentmode-wise-report.component.html'
})
export class PaymentmodeWiseReportComponent {

  public http: HttpClient = null;
  public fromDate: string = "";
  public toDate: string = "";
  public currentDate: string = "";
  public showReport: boolean = false;
  public reportData: Array<any> = new Array<any>();
  public userList: any = [];
  public CurrentUser = '';
  public selUser: any = "";
  public UserId: number = null;
  public PaymentMode: string = "All";
  public Type: string = "All";
  public summaryData: Array<any> = new Array<any>();
  public loading: boolean = false;
  public PaymentModes: any[] = [];
  public Types: any = [
    { TypeName: 'Cash Sales' },
    { TypeName: 'Cash Sales Return' },
    { TypeName: 'Deposit Received' },
    { TypeName: 'Credit Settlement' },
    { TypeName: 'Deposit Refund' },
    { TypeName: 'Cash Discount Given' },
    { TypeName: 'Cash Discount Received' },
    { TypeName: 'Maternity Allowance' },
    { TypeName: 'Maternity Allowance Return' },
  ]

  public gridExportOptions: any;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public dateRange: string = "";
  public footerContent = '';
  public datePreference: string = "np";
  public Header: string = '';
  public MultiplePaymentModeReportColumns: Array<any> = null;
  StoreId: number = null;
  constructor(
    public pharmacyBLService: PharmacyBLService,
    public msgBoxServ: MessageboxService,
    public coreservice: CoreService,
    public settingsBLService: SettingsBLService,
    public securityService: SecurityService,
    public nepCalendarService: NepaliCalendarService,
    public dispensaryService: DispensaryService) {
    this.GetHeaderParameter();
    this.LoadUser();
    this.LoadPaymentModes();
    this.fromDate = moment().format('YYYY-MM-DD');
    this.toDate = moment().format('YYYY-MM-DD');
    this.currentDate = moment().format('YYYY-MM-DD');
    this.StoreId = this.dispensaryService.activeDispensary.StoreId;
  }

  GetHeaderParameter() {
    var customerHeaderparam = this.coreservice.Parameters.find(a => a.ParameterGroupName == "Pharmacy" && a.ParameterName == "Pharmacy Receipt Header");
    if (customerHeaderparam != null) {
      var customerHeaderParamValue = customerHeaderparam.ParameterValue;
      if (customerHeaderParamValue) {
        var headerDetail = JSON.parse(customerHeaderParamValue);

        this.Header = `
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td colspan="4" style="text-align:center;font-size:large;"><strong>${headerDetail.hospitalName}</strong></td>
          </tr><br/>
           <tr>
            <td></td>
            <td></td>
            <td></td>
            <td colspan="4" style="text-align:center;font-size:small;"><strong>${headerDetail.address}</strong></td>
          </tr>`;

      }
    }
  }

  LoadUser() {
    this.settingsBLService.GetUserList()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.userList = res.Results;
          CommonFunctions.SortArrayOfObjects(this.userList, "EmployeeName");
          this.CurrentUser = this.securityService.loggedInUser.Employee.FullName;

        }
        else {
          alert("Failed ! " + res.ErrorMessage);
        }
      });
  }

  LoadPaymentModes() {
    let paymentModeList = this.coreservice.masterPaymentModes;
    this.PaymentModes = paymentModeList.filter(a => a.PaymentSubCategoryName.toLowerCase() != "deposit" && a.PaymentSubCategoryName.toLowerCase() != 'others' && a.PaymentSubCategoryName.toLowerCase() != 'credit');
  }

  UserListFormatter(data: any): string {
    return data["EmployeeName"];
  }
  userChanged() {
    this.UserId = this.selUser ? this.selUser.EmployeeId : null;
  }

  OnFromToDateChange($event) {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;
      this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
    }

  }

  PaymentModeChange($event) {
    this.PaymentMode = $event ? $event.target.value : this.PaymentMode;
  }

  TypeChanged($event) {
    this.Type = $event ? $event.target.value : this.Type;
  }

  Load() {
    if (this.fromDate != null && this.toDate != null) {
      this.loading = true;
      this.pharmacyBLService.GetPaymentWiseReportData(this.fromDate, this.toDate, this.PaymentMode, this.Type, this.UserId, this.StoreId).finally(() => {
        this.loading = false;
      }).subscribe(res => {
        if (res.Status == "OK") {
          this.Success(res)
        }
      }, err => this.Error(err));
    }
    else {
      this.msgBoxServ.showMessage("notice-message", ["Please provide valid date."]);
    }
  }

  Success(res) {
    if (res.Status == "OK") {
      this.MultiplePaymentModeReportColumns = PHRMGridColumns.DigitalPaymentReport;
      this.reportData = null;
      this.summaryData = null;
      this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('Date', false));
      let data = JSON.parse(res.Results.JsonData);
      if (data.InvoiceWisePaymentModeReport.length > 0) {
        this.reportData = data.InvoiceWisePaymentModeReport;
        this.summaryData = data.ReportSummary;
        this.CalculateSummary(this.summaryData);
        this.showReport = true;
        this.LoadExportOptions();
      }
      else {
        this.msgBoxServ.showMessage("notice-message", ['Data is Not Available Between Selected dates...Try Different Dates or select different User']);
      }
    }
    else {
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
    }
  }

  Error(err) {
    this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
  }

  LoadExportOptions() {

    this.gridExportOptions = {
      fileName: 'PHRM_PaymentModeWiseReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };
  }

  Print(printId: string) {

    this.datePreference = this.coreservice.DatePreference;
    let fromDate_string: string = "";
    let toDate_string: string = "";
    let printedDate: any = moment().format("YYYY-MM-DD HH:mm");
    let printedDate_string: string = "";
    let calendarType: string = "BS";
    if (this.datePreference == "en") {
      fromDate_string = moment(this.fromDate).format("YYYY-MM-DD");
      toDate_string = moment(this.toDate).format("YYYY-MM-DD");
      printedDate_string = printedDate;
      calendarType = "(AD)";
    }
    else {
      fromDate_string = this.nepCalendarService.ConvertEngToNepaliFormatted(this.fromDate, "YYYY-MM-DD");
      toDate_string = this.nepCalendarService.ConvertEngToNepaliFormatted(this.toDate, "YYYY-MM-DD");
      printedDate_string = this.nepCalendarService.ConvertEngToNepaliFormatted(printedDate, "YYYY-MM-DD HH:mm");
      calendarType = "(BS)";
    }

    let popupWinindow;
    var printContents = '<div style="text-align: center">' + this.Header + ' </div>' + '<br>';
    printContents += '<div style="text-align: center">PaymentMode Wise Report(Summary)</div>' + '<br>';
    printContents += '<b style="float: left">Date Range' + calendarType + ':  From:' + fromDate_string + '  To:' + toDate_string + '</b>' + '<b style="float: right"> Printed By :' + this.CurrentUser + '</b><br>';
    printContents += '<b style="float: right"> Printed On :' + printedDate_string + '</b>';
    let summaryTable = document.getElementById(printId);
    printContents += summaryTable.innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    let documentContent = "<html><head>";
    documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../themes/theme-default/DanphePrintStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + printContents + '</body></html>'
    popupWinindow.document.write(documentContent);
    popupWinindow.document.close();
  }

  public totalSummaryView = {
    CashSalesAmount: 0,
    CashSalesReturnAmount: 0,
    DepositReceived: 0,
    DepositRefund: 0,
    CollectionFromReceivables: 0,
    SettCashDiscount: 0,
    CashCollection: 0,
  }

  CalculateSummary(summaryData: any) {
    if (summaryData && summaryData.length > 0) {
      this.totalSummaryView.CashSalesAmount = 0
      this.totalSummaryView.CashSalesReturnAmount = 0
      this.totalSummaryView.DepositReceived = 0
      this.totalSummaryView.DepositRefund = 0
      this.totalSummaryView.CollectionFromReceivables = 0
      this.totalSummaryView.SettCashDiscount = 0
      this.totalSummaryView.CashCollection = 0

      this.totalSummaryView.CashSalesAmount = summaryData.reduce((acc, amount) => acc + amount.CashSales, 0);
      this.totalSummaryView.CashSalesReturnAmount = summaryData.reduce((acc, amount) => acc + amount.ReturnCashSales, 0);
      this.totalSummaryView.DepositReceived = summaryData.reduce((acc, amount) => acc + amount.DepositReceived, 0);
      this.totalSummaryView.DepositRefund = summaryData.reduce((acc, amount) => acc + amount.DepositRefund, 0);
      this.totalSummaryView.CollectionFromReceivables = summaryData.reduce((acc, amount) => acc + amount.CollectionFromReceivable, 0);
      this.totalSummaryView.SettCashDiscount = summaryData.reduce((acc, amount) => acc + amount.SettlementDiscount, 0);
      this.totalSummaryView.CashCollection = summaryData.reduce((acc, amount) => acc + amount.CashCollection, 0);
    }
  }

}
