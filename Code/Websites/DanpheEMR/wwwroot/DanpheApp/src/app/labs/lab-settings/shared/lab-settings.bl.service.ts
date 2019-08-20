import { Injectable, Directive } from '@angular/core';
import { LabSettingsDLService } from './lab-settings.dl.service';
import { LabReportTemplateModel } from '../../shared/lab-report-template.model';
import { LabTest } from '../../shared/lab-test.model';
import * as _ from 'lodash';
import { LabSignatoriesViewModel } from './lab-signatories.model';
import { CFGParameterModel } from '../../../settings/shared/cfg-parameter.model';
import { LabComponentModel } from '../../shared/lab-component-json.model';
import { LabVendorsModel } from '../../external-labs/vendors-settings/lab-vendors.model';
import { CoreCFGLookUp } from './coreCFGLookUp.model';
//import { LabVendorsModel } from '../external-labs/vendors/lab-vendors.model';


@Injectable()
export class LabSettingsBLService {
  constructor(public labSettingDlServ: LabSettingsDLService) {

  }

  //Get all Report Template List
  GetAllReportTemplates() {
    return this.labSettingDlServ.GetAllReportTemplates().
      map(res => { return res });
  }


  GetAllLabTests() {
    return this.labSettingDlServ.GetAllLabTests().
      map(res => { return res });
  }

  GetLabDefaultSignatories() {
    return this.labSettingDlServ.GetLabDefaultSignatories().
      map(res => { return res });
  }

  GetAllDoctors() {
    return this.labSettingDlServ.GetAllDoctors().
      map(res => { return res });
  }

  GetAllLabTestComponents() {
    return this.labSettingDlServ.GetAllLabTestComponents().
      map(res => { return res });
  }

  GetAllLabLookUpNames() {
    return this.labSettingDlServ.GetAllLookUpNames().
      map(res => { return res });
  }

  

  //Post New Report Template
  PostNewReportTemplate(reportTemplateData: LabReportTemplateModel) {
    //omiting the validators during post because it causes cyclic error during serialization in server side.
    let newReportTemplateData: any = _.omit(reportTemplateData, ['ReportTemplateValidator']);

    let data = JSON.stringify(newReportTemplateData);
    return this.labSettingDlServ.PostNewReportTemplate(data)
      .map(res => { return res })
  }

  //Post New Lab Test
  PostNewLabTest(labTestData: LabTest) {
    //omiting the validators during post because it causes cyclic error during serialization in server side.
    let newlabTestData: any = _.omit(labTestData, ['LabTestValidator']);

    let data = JSON.stringify(newlabTestData);
    return this.labSettingDlServ.PostNewLabTest(data)
      .map(res => { return res })
  }

  PostLabTestComponent(componentList: Array<LabComponentModel>) {
    let newComponents: any = [];
    componentList.forEach(comp => {
      comp = _.omit(comp, ['LabComponentJsonValidator']);
      newComponents.push(comp);
    });
    let data = JSON.stringify(newComponents);
    return this.labSettingDlServ.PostLabTestComponent(data)
      .map(res => { return res })
  }
  PostLabLookUp(componentList: CoreCFGLookUp) {
    let data = JSON.stringify(componentList);
    return this.labSettingDlServ.PostLabLookUp(data)
      .map(res => { return res })
  }



  //Update the template
  UpdateTemplate(reportTemplateData: LabReportTemplateModel) {
    //omiting the validators during post because it causes cyclic error during serialization in server side.
    let newReportTemplateData: any = _.omit(reportTemplateData, ['ReportTemplateValidator']);
    let data = JSON.stringify(newReportTemplateData);
    return this.labSettingDlServ.PutNewReportTemplate(data)
      .map(res => { return res })
  }

  UpdateNewLabTest(labTestData: LabTest) {
    let newlabTestData: any = _.omit(labTestData, ['LabTestValidator']);
    let data = JSON.stringify(newlabTestData);
    return this.labSettingDlServ.PutNewLabTest(data)
      .map(res => { return res })
  }

  UpdateDefaultSignatories(SignatoriesData: Array<CFGParameterModel>) {
    let data = JSON.stringify(SignatoriesData);
    return this.labSettingDlServ.UpdateDefaultSignatories(data)
      .map(res => { return res })
  }

  UpdateLabTestComponent(componentList: Array<LabComponentModel>) {
    let newComponents: any = [];
    componentList.forEach(comp => {
      comp = _.omit(comp, ['LabComponentJsonValidator']);
      newComponents.push(comp);
    });
    let data = JSON.stringify(newComponents);
    return this.labSettingDlServ.UpdateLabTestComponent(data)
      .map(res => { return res })
  }
  UpdateLabLookUpComponent(componentList: CoreCFGLookUp) {
    let data = JSON.stringify(componentList);
    return this.labSettingDlServ.UpdateLabLookUpComponent(data)
      .map(res => { return res })
  }

  //start: sud:28Apr'19--for lab-external vendors.
  GetLabVendors() {
    return this.labSettingDlServ.GetLabVendors();
  }

  AddLabVendor(labVendor: LabVendorsModel) {
    let vendorJson = JSON.stringify(labVendor);

    return this.labSettingDlServ.PostLabVendor(vendorJson);

  }

  UpdateLabVendor(labVendor: LabVendorsModel) {
    let vendorJson = JSON.stringify(labVendor);
    return this.labSettingDlServ.PutLabVendor(vendorJson);

  }

  //end: sud:28Apr'19--for lab-external vendors.
}
