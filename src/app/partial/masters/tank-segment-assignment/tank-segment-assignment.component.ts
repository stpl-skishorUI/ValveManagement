import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ErrorsService } from 'src/app/core/services/errors.service';
import { LocalstorageService } from 'src/app/core/services/localstorage.service';

@Component({
  selector: 'app-tank-segment-assignment',
  templateUrl: './tank-segment-assignment.component.html',
  styleUrls: ['./tank-segment-assignment.component.css']
})
export class TankSegmentAssignmentComponent implements OnInit {
  tankSegmentForm: FormGroup | any;
  filterForm: FormGroup | any;
  responseArray = new Array();
  tankArr = new Array();
  segmentArr = new Array();
  yojanaArr : any;
  networkArr : any;
  tankSegmentTable = new Array();
  editObj: any;
  pageNumber: number = 1;
  pagesize: number = 10;
  totalRows: any;
  editFlag: boolean = false;
  tankLabel !: string;
  submitted: boolean = false;
  filterYojanaArray = new Array();
  filterNetworkArr = new Array();
  storeSegmentArr = new Array();
  deleteTankSegId : any;
  @ViewChild('closebutton') closebutton: any;
  getAllLocalStorageData:any

  constructor(private service: ApiService,
    private commonService : CommonService,
    private error: ErrorsService,
    private localStorage: LocalstorageService,
    private fb: FormBuilder,
    private toastrService: ToastrService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.getAllLocalStorageData = this.localStorage.getLoggedInLocalstorageData();
    this.formField();
    this.filterFormField();
    this.getTableData();
    this.getAllYojana();
  }

  formField() {
    this.tankSegmentForm = this.fb.group({
      "id": [this.editObj ? this.editObj.id : 0],
      "tankId": ['', Validators.required],
      "segmentId": [''],
      tanksegment: [],
      "yojanaId": ['', Validators.required],
      "networkId": ['', Validators.required]
    })
  }

  filterFormField() {
    this.filterForm = this.fb.group({
      yojanaId: [0],
      networkId: [0]
    })
  }

  get f() {
    return this.tankSegmentForm.controls;
  }

  getTableData() {
    this.service.setHttp('get', 'ValveTankSegment/GetAllTanksSegment?pageno=' + this.pageNumber + '&pagesize=' + this.pagesize + '&yojanaId=' + (this.filterForm.value.yojanaId || 0 ||  this.getAllLocalStorageData.yojanaId) + '&networkId=' + (this.filterForm.value.networkId || 0), false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {
          this.responseArray = res.responseData.responseData1;
          this.totalRows = res.responseData.responseData2.totalPages * this.pagesize;
        } else {
          this.responseArray = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }

  getAllYojana() {
    this.service.setHttp('get', 'api/MasterDropdown/GetAllYojana?YojanaId=' + this.getAllLocalStorageData.yojanaId, false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {
          this.yojanaArr = res.responseData;
          this.filterYojanaArray = res.responseData;
          this.filterYojanaArray?.length == 1 ? (this.filterForm.patchValue({ yojanaId: this.filterYojanaArray[0].yojanaId }), this.getAllFilterNetwork()) : '';
          this.yojanaArr?.length == 1 ? (this.tankSegmentForm.patchValue({ yojanaId: this.yojanaArr[0].yojanaId }), this.getNetwork()) : '';
          this.editObj && this.getAllLocalStorageData.userId == 1 ? (this.f['yojanaId'].setValue(this.editObj.yojanaId), this.getNetwork()) : '';
        } else {
          this.yojanaArr = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }

  getAllFilterNetwork() {
    if (!this.editFlag) {
    this.service.setHttp('get', 'api/MasterDropdown/GetAllNetworkbyUserId?UserId=' + this.getAllLocalStorageData.userId + '&YojanaId=' + this.filterForm.value.yojanaId, false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {this.filterNetworkArr = res.responseData;
          this.filterNetworkArr?.length == 1 ? (this.filterForm.patchValue({ networkId: this.filterNetworkArr[0].networkId }), this.getTableData()) : '';
        } else {
          this.filterNetworkArr = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }
  }

  getNetwork() {
    this.service.setHttp('get', 'api/MasterDropdown/GetAllNetworkbyUserId?UserId=' + this.getAllLocalStorageData.userId + '&YojanaId=' + this.tankSegmentForm.value.yojanaId, false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {
          this.networkArr = res.responseData;
          this.networkArr?.length == 1 ? (this.tankSegmentForm.patchValue({ networkId: this.networkArr[0].networkId }), this.getAllTank(), this.getAllSegment()) : '';
          this.networkArr?.length > 1  ? (this.tankSegmentForm.patchValue({ networkId: this.tankSegmentForm.value.networkId }), this.getAllTank()) : '';
          
          this.editObj && this.getAllLocalStorageData.userId == 1 ? (this.f['networkId'].setValue(this.editObj.networkId), (this.getAllTank(), this.getAllSegment())) : '';
        } else {
          this.networkArr = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }

  getAllTank() {
    this.service.setHttp('get', 'api/MasterDropdown/GetAllTank?YojanaId=' + this.tankSegmentForm.value.yojanaId + '&NetworkId=' + (this.tankSegmentForm.value.networkId || 0), false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {
          this.tankArr = res.responseData;
          console.log("tankArr : ", this.tankArr);
          console.log("responseArray : ", this.responseArray);
          
          
          this.editObj ? (this.f['tankId'].setValue(this.editObj.tankId)) : '';
        } else {
          this.tankArr = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }

  getAllSegment() {
    this.service.setHttp('get', 'api/MasterDropdown/GetAllSegmentForTank?YojanaId=' + (this.tankSegmentForm.value.yojanaId || 0) + '&NetworkId=' + (this.tankSegmentForm.value.networkId || 0), false, false, false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: ((res: any) => {
        if (res.statusCode == '200') {
          this.segmentArr = res.responseData;
        } else {
          this.segmentArr = [];
        }
      }),
      error: (error: any) => {
        this.error.handelError(error.status);
      }
    })
  }

  addTankSegment() {
    if (this.tankSegmentForm.value.segmentId == '') {
      return
    }
    let array = this.segmentArr.find((x: any) => {
      return (x.segmentId == this.tankSegmentForm.value.segmentId)
    })

    if (this.tankSegmentTable.length > 0 && this.tankLabel == 'tank') {
      this.tankSegmentTable = [];
      this.f['segmentId'].setValue('');
      this.tankLabel = '';
    }
    else {
      this.tankLabel = '';
    }

    // for (var i = 0; i < this.tankSegmentTable.length; i++) {
    //   if (this.tankSegmentTable[i].segmentId == this.tankSegmentForm.value.segmentId) {
    //     this.toastrService.success("Record Already Exists");
    //     return
    //   }
    // }
    // this.f['segmentId'].setValue('');

    this.tankSegmentTable.push(array);
    this.storeSegmentArr.push(array);
    
    for(var i=0; i < this.segmentArr.length; i++){
      this.segmentArr.splice(i, 1);
    }
  }

  deleteTankSegment(index: number, data : any) {
    console.log("ondelete data : ", data);
    
    this.tankSegmentTable.splice(index, 1);
    this.segmentArr.push(data);
  }

  onSubmit() {
    this.submitted = true;
    this.tankSegmentForm.value.tanksegment = this.tankSegmentTable;

    let formValue = this.tankSegmentForm.value;
    if (!this.tankSegmentForm.valid) {
      return
    }
    else if(this.tankSegmentTable.length == 0){
      this.toastrService.error("At Least Add One Segment");
    }
    else {
      let obj = {
        "id": formValue.id,
        "tankId": formValue.tankId,
        "segmentId": 0,
        "isDeleted": true,
        "createdBy": this.localStorage.userId(),
        "createdDate": new Date(),
        "modifiedBy": this.localStorage.userId(),
        "modifiedDate": new Date(),
        "timestamp": new Date(),
        "yojanaId": formValue.yojanaId,
        "networkId": formValue.networkId,
        tanksegment: this.tankSegmentTable
      }

      this.spinner.show();
      this.service.setHttp('put', 'ValveTankSegment/Updatetanksegmentassignment', false, obj, false, 'valvemgt');
      this.service.getHttp().subscribe({
        next: ((res: any) => {
          if (res.statusCode == '200') {
            this.getTableData();
            this.closebutton.nativeElement.click();
            this.toastrService.success(res.statusMessage);
            this.spinner.hide();
          }
          else {
            this.toastrService.error(res.statusMessage);
            this.spinner.hide();
          }
        }),
        error: (error: any) => {
          this.error.handelError(error.status);
          this.spinner.hide();
        }
      })
    }
  }

  deleteConformation(id: any) {
    this.deleteTankSegId = id;
  }

  deleteSegMaster() {
    console.log("seg arr", this.tankSegmentTable);
    
    console.log("deleteTankSegId", this.deleteTankSegId)
    let obj = {
      id: parseInt(this.deleteTankSegId),
      deletedBy: this.localStorage.userId(),
    };
    this.service.setHttp('DELETE', 'ValveTankSegment', false, JSON.stringify(obj), false, 'valvemgt');
    this.service.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode == '200') {
          this.toastrService.success(res.statusMessage);
          this.getTableData();
        } else {
          this.commonService.checkDataType(res.statusMessage) == false ? this.error.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.error.handelError(error.status);
      },
    });
  }

  clearForm() {
    this.getTableData();
    this.formField();
    this.editFlag = false;
    this.editObj = '';
    this.tankSegmentTable = [];
    this.submitted = false;
    this.yojanaArr?.length == 1 ?  this.tankSegmentForm.controls['yojanaId'].setValue(this.yojanaArr[0].yojanaId) : '';
    (this.networkArr?.length == 1 && this.tankSegmentForm.value.yojanaId) ? this.tankSegmentForm.controls['networkId'].setValue(this.networkArr[0].networkId) : '';
  }

  onChangeDropdown(label: string) {
    if (label == 'Yojna') {
      this.f['networkId'].setValue('');
      this.f['tankId'].setValue('');
      this.f['segmentId'].setValue('');
      this.tankSegmentTable = [];
    }
    else if (label == 'Network') {
      this.f['tankId'].setValue('');
      this.f['segmentId'].setValue('');
      this.tankSegmentTable = [];
    }
    else if (label == 'Tank') {
      this.f['segmentId'].setValue('');
      this.tankSegmentTable = [];
    }
  }

  onLable(label: string) {
    this.tankLabel = label;
  }

  onEdit(obj: any) {
    this.editFlag = true;
    this.editObj = obj;
    this.formField();
    this.getAllYojana();
    this.tankSegmentTable = this.editObj.tanksegmet;
  }

  onClickPagintion(pageNo: number) {
    this.pageNumber = pageNo;
    this.getTableData();
  }

  clearfilter(label: any) {
    if (label == 'Yojana') {
      this.filterForm.controls['networkId'].setValue(0);
    } else if (label == 'Network') {
      this.filterForm.controls['yojanaId'].setValue(this.filterForm.value.yojanaId);
    }
    this.getTableData();
    this.pageNumber = 1;
  }
}
