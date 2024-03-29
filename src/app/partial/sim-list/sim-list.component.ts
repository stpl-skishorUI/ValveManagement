import { Component, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { ErrorsService } from 'src/app/core/services/errors.service';
import { CommonService } from 'src/app/core/services/common.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalstorageService } from 'src/app/core/services/localstorage.service';
import { ValidationService } from 'src/app/core/services/validation.service';
@Component({
  selector: 'app-sim-list',
  templateUrl: './sim-list.component.html',
  styleUrls: ['./sim-list.component.css'],
})
export class SimListComponent implements OnInit {
  //Initialize variable
  editFlag!: boolean;
  editData!: any;
  simOperatorList: { id: number; operatorName: string; sortOrder: number }[] = [];
  simFormData: FormGroup | any;
  searchForm!: FormGroup;
  submitted: boolean = false;
  pageNumber: number = 1;
  pagesize: number = 10;
  totalRows: any;
  getAllYojanaArray = new Array();
  getAllNetworkArray = new Array();
  getAllFilterNetworkArray = new Array();
  simArray = new Array();
  listCount!: number;
  getAllLocalStorageData!:any;
  @ViewChild('addSimData') addSimData: any;
  deleteSimId: number = 0;
  highlitedRow: any;

  constructor(
    private spinner: NgxSpinnerService,
    public apiService: ApiService,
    public commonService: CommonService,
    public validations: ValidationService,
    private errorSerivce: ErrorsService,
    private toastrService: ToastrService,
    private fb: FormBuilder,
    private localStorage: LocalstorageService
  ) { }

  ngOnInit(): void {
    this.getAllLocalStorageData = this.localStorage.getLoggedInLocalstorageData();
    this.controlForm();
    this.searchFormControl();
    this.getSimOperator();
    this.getAllYojana();
    this.localStorage.userId() == 1 ? this.getAllSimData() : '';
  }

  //Form Initialize
  controlForm() {
    this.simFormData = this.fb.group({
      id: +[''],
      yojanaId:['', Validators.required],
      networkId: ['', Validators.required],
      simNo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]{20}$')]],
      imsiNo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]{15}$')]],
      operatorId: ['', [Validators.required,Validators.pattern('[^0]+')]],
    });
  }

  // SearchForm Initialize
  searchFormControl(){
    this.searchForm=this.fb.group({
      yojana:[''],
      network:['']
    })
  }

 

  // Yojana Array
  getAllYojana() {
    this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllYojana?YojanaId=' + this.getAllLocalStorageData.yojanaId, false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode == '200') {
          this.getAllYojanaArray = res.responseData;
          this.getAllYojanaArray?.length == 1 ? (this.searchForm.patchValue({ yojana: this.getAllYojanaArray[0].yojanaId }), this.getAllNetwork(false)) : '';
          this.getAllYojanaArray?.length == 1 ? (this.simFormData.patchValue({ yojanaId: this.getAllYojanaArray[0].yojanaId }), this.getAllNetwork(true)) : '';
        }
      }, error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    })
  }

  // Network Array
  getAllNetwork(networkFlag?:any) {
    this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllNetworkbyUserId?UserId=' + this.getAllLocalStorageData.userId
      + '&YojanaId=' + ((networkFlag?this.simFormData.value.yojanaId:this.searchForm.value.yojana) || 0), false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode == '200') { 
          !networkFlag ? (this.getAllFilterNetworkArray = res.responseData) : (this.getAllNetworkArray = res.responseData);
          (this.getAllYojanaArray?.length == 1 && this.getAllFilterNetworkArray?.length > 1) ?  (this.getAllSimData()) : '';
          this.editFlag ? (this.simFormData.controls['networkId'].setValue(this.editData.networkId)) : '';
          this.getAllFilterNetworkArray.length == 1 ? (this.searchForm.patchValue({network: this.getAllFilterNetworkArray[0].networkId }),this.getAllSimData()) : '';
          this.getAllNetworkArray.length == 1 ? this.simFormData.patchValue({networkId: this.getAllNetworkArray[0].networkId }) : '';
        } else {
          this.getAllNetworkArray = [];
        }
      }, error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    })
  }

  //Get Sim Operator
  getSimOperator() {
    this.spinner.show();
    this.apiService.setHttp('get','SimMaster/GetSIMOperatorList',false,false,false,'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.spinner.hide();
          this.simOperatorList = res.responseData;
        } else {
          this.spinner.hide();
          this.simOperatorList = [];
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

  //Clear Form Data
  clearForm(formDirective?: any) {
    formDirective?.resetForm();
    this.getAllLocalStorageData.userId == 1 ?
    this.getAllNetworkArray = [] : '';
    this.editFlag = false;
    this.editData = '';
    this.submitted = false;
    this.controlForm();
    this.getAllYojanaArray?.length == 1 ?  this.simFormData.controls['yojanaId'].setValue(this.getAllYojanaArray[0].yojanaId) : '';
    (this.getAllNetworkArray?.length == 1 && this.simFormData.value.yojanaId) ? this.simFormData.controls['networkId'].setValue(this.getAllNetworkArray[0].networkId) : '';
  }

  //To Submit the Data
  onSubmit() {
    let formData = this.simFormData.value;
    this.submitted = true;
    if (this.simFormData.invalid) {
      return;
    } else {
      let obj = {
        ...formData,
        operatorName:"",
        createdBy: this.localStorage.userId(),
      };
      this.spinner.show();
      let urlType;
      formData.id == 0 ? (urlType = 'POST') : (urlType = 'PUT');
      this.apiService.setHttp(urlType,'SimMaster',false, obj,false,'valvemgt'
      );
      this.apiService.getHttp().subscribe(
        (res: any) => {
          if (res.statusCode == '200') {
            this.spinner.hide();
            this.toastrService.success(res.statusMessage);
            this.editFlag = false;
            this.addSimData.nativeElement.click();
            this.getAllSimData();
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

  //Get Form Data controls for Validation Purpose
  get f() {
    return this.simFormData.controls;
  }

  //Get Sim Details
  getAllSimData() {
    this.spinner.show();
    this.apiService.setHttp('get', 'SimMaster?UserId=1&pageno=' + this.pageNumber + '&pagesize=' + 
    this.pagesize +'&YojanaId='+ (this.searchForm.value.yojana || 0) +'&NetworkId=' + (this.searchForm.value.network || 0), false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.spinner.hide();
          this.simArray = res.responseData.responseData1;
          this.listCount = res.responseData.responseData2?.totalCount;
          this.highlitedRow = 0;
        } else {
          this.spinner.hide();
          this.simArray = [];
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

  selPagination(pagNo: number) {
    this.pageNumber = pagNo;
    this.getAllSimData();
  }

  //Update Sim Data
  updateSimData(simData: any) {
    this.editData = simData;
    this.highlitedRow = simData.id;
    this.editFlag = true;
    this.simFormData.patchValue({
      id: simData.id,
      yojanaId: simData.yojanaId,
      simNo: simData.simNo,
      imsiNo: simData.imsiNo,
      operatorId: simData.operatorId,
    });
    this.getAllNetwork(true);
  }

  deleteConformation(id: any) {
    this.deleteSimId = id;
    this.highlitedRow = id;
  }

  //Delete Sim Data
  deleteSim() {
    let obj = {
      id: this.deleteSimId,
      deletedBy: this.localStorage.userId(),
    };
    this.apiService.setHttp('DELETE','SimMaster',false,obj,false,'valvemgt'
    );
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.toastrService.success(res.statusMessage);
          this.getAllSimData();
        } else {
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
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
      this.searchForm.controls['network'].setValue('')
      this.getAllFilterNetworkArray = [];
    }
    this.getAllSimData()
  }

  clearDropdown() {
    this.simFormData.controls['networkId'].setValue('');
    this.getAllNetworkArray = [];
    this.editFlag = false;
  }
}
