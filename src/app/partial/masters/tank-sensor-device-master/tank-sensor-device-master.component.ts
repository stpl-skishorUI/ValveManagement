import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ErrorsService } from 'src/app/core/services/errors.service';
import { LocalstorageService } from 'src/app/core/services/localstorage.service';
import { ValidationService } from 'src/app/core/services/validation.service';

@Component({
  selector: 'app-tank-sensor-device-master',
  templateUrl: './tank-sensor-device-master.component.html',
  styleUrls: ['./tank-sensor-device-master.component.css']
})
export class TankSensorDeviceMasterComponent implements OnInit {

  // Variable Declaration & Initialization
  editFlag:boolean = false;
  editData!:any;
  buttonValue:string='Submit';
  deleteSegmentId!:any;
  postObj!:any;
  formData!:any;
  deleteObj!:any;
  tankSensorDeviceFrm!:FormGroup | any;
  searchForm!:FormGroup | any;
  getAllSimArray = new Array();
  getAllTankArray = new Array();
  getAllFilterTankArray = new Array();
  getAllYojanaArray = new Array();
  getAllNetworkArray = new Array();
  getAllFilterNetworkArray = new Array();
  allSensorDeviceArray = new Array();
  pageNumber: number = 1;
  pagesize: number = 10;
  totalRows: any;
  submitted = false;
  highlitedRow:any;
  getAllLocalStorageData!:any;
  @ViewChild('closebutton') closebutton:any;
  constructor(private apiService: ApiService,
    private fb: FormBuilder,
    public validation: ValidationService,
    private localStorage: LocalstorageService,
    public commonService: CommonService,
    private spinner: NgxSpinnerService,
    private toastrService: ToastrService,
    private errorSerivce: ErrorsService) { }

  ngOnInit(): void {
    this.getAllLocalStorageData = this.localStorage.getLoggedInLocalstorageData();
    this.controlForm();
    this.searchFormControl();
    this.getAllYojana();
    this.localStorage.userId() == 1 ? this.getAllSensorDeviceTableData() : '';
    // if(this.getAllLocalStorageData.userId != 1){
    //   this.getAllNetwork();
    // }
  }

  // Get Form Control Values
  get f() {
    return this.tankSensorDeviceFrm.controls;
  }

  // Get Controls of Main Form
  controlForm(){
    this.tankSensorDeviceFrm = this.fb.group({
      id:[0],
      deviceId: ['',Validators.required],
      deviceName: ['',Validators.required],
      simId: ['',Validators.required],
      deviceDescription: [''],
      tankId: [(this.getAllTankArray.length == 1 && this.getAllLocalStorageData.userId != 1)? this.getAllTankArray[0].tankId : '',Validators.required],
      yojanaId: ['',Validators.required],
      networkId: ['',Validators.required]
    })
  }

  // Get Controls of Search/Filter Form
  searchFormControl(){
    this.searchForm=this.fb.group({
      yojana: [''],
      network: [''],
      tank:['']
    })
      this.getAllTank(false);
  }

  onEdit(data?:any){
    console.log(data,'editData');
    
  this.editFlag = true;
  this.editData = data;
  this.buttonValue = 'Update';
  this.highlitedRow = data.id;
  this.tankSensorDeviceFrm.patchValue({
      id: data.id,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      deviceDescription: data.deviceDescription,
      tankName: data.tankName,
      isDeleted: data.isDeleted,
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy,
  })
  this.getAllYojana();
}

// Yojana Array Declartion and Initialization
getAllYojana() {
  this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllYojana?YojanaId=' + this.getAllLocalStorageData.yojanaId, false, false, false, 'valvemgt');
  this.apiService.getHttp().subscribe({
    next: (res: any) => {
      if (res.statusCode == '200') {
        this.getAllYojanaArray = res.responseData;
        this.getAllYojanaArray?.length == 1 ? (this.searchForm.patchValue({ yojana: this.getAllYojanaArray[0].yojanaId }), this.getAllNetwork(false)) : '';
        this.getAllYojanaArray?.length == 1 ? (this.tankSensorDeviceFrm.patchValue({ yojanaId: this.getAllYojanaArray[0].yojanaId }), this.getAllNetwork(true)) : '';
        this.editFlag ? (this.tankSensorDeviceFrm.controls['yojanaId'].setValue(this.editData.yojanaId), this.getAllNetwork(true)) : '';
      }else{
        this.getAllYojanaArray = [];
      }
    },  error: (error: any) => {
      this.errorSerivce.handelError(error.status);
    },
  })
}
  
// Network Array Declaration and Initialization
getAllNetwork(flag?:any) {
  let networkFlag = flag ;
  let editYojanaId;
  this.editFlag ? (editYojanaId = this.editData.yojanaId) : ''
  this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllNetworkbyUserId?UserId='+ this.getAllLocalStorageData.userId
  +'&YojanaId=' +  ((networkFlag?this.tankSensorDeviceFrm.value.yojanaId:this.searchForm.value.yojana) || 0) , false, false, false, 'valvemgt');
  this.apiService.getHttp().subscribe({
    next: (res: any) => {
      if (res.statusCode == '200') {
        networkFlag ? (this.getAllNetworkArray = res.responseData) : (this.getAllFilterNetworkArray = res.responseData);
        (this.getAllYojanaArray?.length == 1 && this.getAllFilterNetworkArray?.length > 1) ?  (this.getAllSensorDeviceTableData()) : '';
          this.editFlag ? (this.tankSensorDeviceFrm.controls['networkId'].setValue(this.editData.networkId),this.getAllSim(true),this.getAllTank(true)) : '';
          this.getAllFilterNetworkArray.length == 1 ? this.searchForm.patchValue({network: this.getAllFilterNetworkArray[0].networkId },this.getAllTank(false)) : '';
          this.getAllNetworkArray.length == 1 ? this.tankSensorDeviceFrm.patchValue({networkId: this.getAllNetworkArray[0].networkId },this.getAllTank(true),this.getAllSim(true)) : '';
      }else{
        networkFlag ? (this.getAllNetworkArray = []) : (this.getAllFilterNetworkArray = [])
      }
    },  error: (error: any) => {
      this.errorSerivce.handelError(error.status);
    },
  })
}

  // Tank Array Declaration and Initialization
  getAllTank(flag?:any){
    let tankFlag = flag;
    this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllTank?YojanaId='+ (tankFlag?(this.tankSensorDeviceFrm.value.yojanaId || 0):(this.searchForm.value.yojana || 0)) +'&NetworkId=' + 
    (tankFlag?(this.tankSensorDeviceFrm.value.networkId || 0):(this.searchForm.value.network || 0)), false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode == '200') {
          tankFlag ? (this.getAllTankArray = res.responseData) : (this.getAllFilterTankArray = res.responseData);
          this.editFlag ? this.tankSensorDeviceFrm.controls['tankId'].setValue(this.editData.tankId) : '';

          this.getAllFilterTankArray.length == 1 ? (this.searchForm.patchValue({tank: this.getAllFilterTankArray[0].tankId }),this.getAllSensorDeviceTableData()) : '';

          (this.getAllFilterNetworkArray?.length == 1 && this.getAllFilterTankArray?.length > 1) ?  (this.getAllSensorDeviceTableData()) : '';
          this.getAllTankArray.length == 1 ? this.tankSensorDeviceFrm.patchValue({tankId: this.getAllTankArray[0].tankId }) : '';
        }else{
          tankFlag ? (this.getAllTankArray = []) : (this.getAllFilterTankArray = [])
        }
      }, error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    })
  }

// Sim Array Declaration and Initialization
  getAllSim(flag?:any) {
    let simUpdateId = this.editData ? this.editData.simId : 0 ;
    this.apiService.setHttp('GET', 'SimMaster/GetSimListDropdownNewList?YojanaId='+ (this.tankSensorDeviceFrm.value.yojanaId || 0)+'&NetworkId=' + (this.tankSensorDeviceFrm.value.networkId || 0)+
     '&SIMId=' + simUpdateId , false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode == '200') {
          this.getAllSimArray = res.responseData;
          this.editFlag ? this.tankSensorDeviceFrm.controls['simId'].setValue(this.editData.simId) : '';
          this.getAllSimArray.length == 1 ? this.tankSensorDeviceFrm.patchValue({simId: this.getAllSimArray[0].id}) : '';
        }else{
          this.getAllSimArray = [];
        }
      }, error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    })
  }

clearForm(formDirective?:any){
  formDirective?.resetForm();
  this.editFlag = false;
  this.buttonValue = 'Submit';
  this.editData = '';
  this.submitted = false;
  this.getAllLocalStorageData.userId == 1 ? 
  this.getAllNetworkArray = [] : '';
  this.getAllTankArray = [];
  this.controlForm();
  this.getAllYojanaArray?.length == 1 ?  this.tankSensorDeviceFrm.controls['yojanaId'].setValue(this.getAllYojanaArray[0].yojanaId) : '';
  (this.getAllNetworkArray?.length == 1 && this.tankSensorDeviceFrm.value.yojanaId) ? this.tankSensorDeviceFrm.controls['networkId'].setValue(this.getAllNetworkArray[0].networkId) : '';

}

// Main Table Array Declaration and Initialization
getAllSensorDeviceTableData() {
  this.spinner.show();
  this.apiService.setHttp('GET', 'DeviceInfo/GetAllDeviceInformation?UserId='+ this.getAllLocalStorageData.userId +'&pageno='+ 
  (!this.searchForm.value.yojana ? (this.pageNumber) : (this.pageNumber = 1))+'&pagesize='+ this.pagesize +'&YojanaId='+ (this.searchForm.value.yojana || this.getAllLocalStorageData.yojanaId) +
  '&NetworkId='+ (this.searchForm.value.network || 0) +'&TankId=' + (this.searchForm.value.tank || 0), false, false, false, 'valvemgt');
  this.apiService.getHttp().subscribe({
    next: (res: any) => {
      this.spinner.hide();
      if (res.statusCode == "200") {
        this.allSensorDeviceArray = res.responseData.responseData1;
        this.totalRows = res.responseData.responseData2.totalPages * this.pagesize;
        this.highlitedRow=0;
      } else {
        this.spinner.hide();
        this.allSensorDeviceArray = [];
        this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : '';
      }
    },
    error: (error: any) => {
      this.errorSerivce.handelError(error.status);
    },
  });
}

// Submit/ Update Function
onSubmit() {
  this.submitted = true;
  if(this.tankSensorDeviceFrm.invalid){
    return
  }else{
    let formData = this.tankSensorDeviceFrm.value;
    this.postObj = {
      ...formData,
      "createdBy": this.localStorage.userId(),
      "tankName": "string",
      "isDeleted": false,
      "modifiedBy": this.localStorage.userId(),
    }
    this.spinner.show();
    let id:any;
    let urlType:any;
    urlType = (this.editData ? (urlType = 'PUT') : (urlType = 'POST'));
    let urlName:any;
    urlName = this.editData ? (urlName = 'DeviceInfo/UpdateDeviceDetails') : (urlName = 'DeviceInfo/AddDeviceDetails');
    this.apiService.setHttp(urlType,urlName,false,this.postObj,false,'valvemgt');
    this.apiService.getHttp().subscribe(
      (res: any) => {
        if (res.statusCode == '200') {
          this.spinner.hide();
          this.toastrService.success(res.statusMessage);
          this.getAllSensorDeviceTableData();
          this.clearForm();
          this.closebutton.nativeElement.click();
        } else {
          this.toastrService.error(res.statusMessage);
          this.spinner.hide();
        }
      },
      (error: any) => {
        this.errorSerivce.handelError(error.status);
        this.spinner.hide();
      }
    );
  }
}

// Pagination Functionality
onClickPagintion(pageNo: number) {
  this.pageNumber = pageNo;
  this.getAllSensorDeviceTableData();
}

deleteConformation(data?:any){
  this.deleteObj = data;
  this.highlitedRow = data.id;
}

// Delete Function
deleteNetworkMaster(){
  this.deleteObj.isDeleted = true;
  this.apiService.setHttp('DELETE', 'DeviceInfo/DeleteDeviceDetails', false, this.deleteObj, false, 'valvemgt');
  this.apiService.getHttp().subscribe({
    next: (res: any) => {
      if (res.statusCode === '200') {
        this.toastrService.success(res.statusMessage);
        this.getAllSensorDeviceTableData();
      } else {
        this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
      }
    },
    error: (error: any) => {
      this.errorSerivce.handelError(error.status);
    },
  });
}

 clearSerach(flag: any) {
  this.pageNumber = 1;
  this.clearForm();
  if(flag == 'yojana'){
    this.searchForm.controls['network'].setValue(''),
    this.searchForm.controls['tank'].setValue('')
    this.getAllFilterNetworkArray = [];
    this.getAllFilterTankArray = [];
  }
  else if(flag == 'network'){
    this.searchForm.controls['tank'].setValue('')
    this.getAllFilterTankArray = [];
  }
  this.getAllSensorDeviceTableData();
}

clearDropdown(flag?:any){
  if(flag == 'yojana'){
    this.tankSensorDeviceFrm.controls['networkId'].setValue(''),
    this.tankSensorDeviceFrm.controls['tankId'].setValue(''),
    this.tankSensorDeviceFrm.controls['simId'].setValue('')
    this.getAllNetworkArray = [];
    this.getAllTankArray = [];
    this.getAllSimArray = [];
  }
  else if(flag == 'network'){
    this.tankSensorDeviceFrm.controls['tankId'].setValue(''),
    this.tankSensorDeviceFrm.controls['simId'].setValue('')
    this.getAllTankArray = [];
    this.getAllSimArray = [];
  }
  this.editFlag = false;
}
}