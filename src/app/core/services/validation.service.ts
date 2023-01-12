import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }
  name = ('^[a-zA-Z]+$');
  fullName = ('^[a-zA-Z][a-zA-Z ]*$');
  email = ('^[a-zA-Z0-9][a-zA-Z0-9._-]+[a-zA-Z0-9]+@([a-z0-9.]+[.])+[a-z]{2,5}$');
  mobile_No = ('[6-9]\\d{9}');
  age = ('[0-9]{2,}|[5-9]{1}$');
  aadhar_card = ('^[2-9][0-9]{11}$');
  alphabetsAndBracket= ('^[a-zA-Z() ]+$');
  marathi=('^[\u0900-\u0965 ]+$');
  addDesignation = ('^[a-zA-Z() =.,-]+$');
  ngoName = ('^[a-zA-Z0-9() =!@#&_+.,-]+$');

  alphabetsWithSpaces(event: any) {
    const maskSeperator = new RegExp('^([a-zA-Z ])', 'g');
    return maskSeperator.test(event.key);
  }
  onlyAlphabetsWithSpace(event: any) {
    const maskSeperator = new RegExp('^([a-zA-Z])', 'g');
    return maskSeperator.test(event.key);
  }
  noSpacesAtStart(event: any) {
    const maskSeperator = new RegExp('^[ ]+|[ ]+$', 'm');
    return !maskSeperator.test(event.key);
  }

  onlyDigits(event: any) {
    const maskSeperator = new RegExp('^([0-9])', 'g');
    return maskSeperator.test(event.key);
  }

  onlyAlphabets(event: any) {
    if (!this.noSpacesAtStart(event)) {
      return false
    }
    const maskSeperator = new RegExp('^([a-zA-Z])', 'g');
    return maskSeperator.test(event.key);
  }

  removeSpaceAtBegining(event: any) {
    let temp = true;
    try {
      if (!event.target.value[0].trim()) {
        event.target.value = event.target.value.substring(1).trim();
        temp = false;
      }
    }
    catch (e) {
      temp = false;
    }
    return temp
  }

  unicodeMarathiValidation(event: any) {
    const maskSeperator = new RegExp('[^\u0900-\u0965 ]+', 'm');
    return !maskSeperator.test(event.key);
  }
  emailRegex(event: any) { //Email Validation
    if (!this.noSpacesAtStart(event)) return false; // First Space not Accept
    if (event.currentTarget.value.split('..').length - 1 == 1 && (event.keyCode == 46)) return false;  // double .Dot not accept
    if (event.currentTarget.value.split('@').length - 1 == 1 && (event.keyCode == 64)) return false;  // double @ not accept
    if (event.target.selectionStart === 0 && (event.keyCode == 46)) return false;  // starting .Dot not accept
    if (event.target.selectionStart === 0 && (event.keyCode == 64)) return false;  // starting @ not accept
    // let key = parseInt(event.key); if (event.target.selectionStart === 0 && (!isNaN(key))) return false; // starting Number not accept
    const maskSeperator = new RegExp('^([a-zA-Z0-9 .@_-])', 'g'); // only Accept A-Z & 0-9 & .@
    return maskSeperator.test(event.key);
  }

  alphaNumeric(event: any) {
    const maskSeperator = new RegExp('^([a-zA-Z0-9])', 'g');
    return maskSeperator.test(event.key);
  }
  
  noFirstSpaceAllow(event: any) {  // for First Space Not Allow
    if (event.target.selectionStart === 0 && (event.code === 'Space')) {
      event.preventDefault();
    }
  }

  alphaNumericWithSpacesAndSpecChars(event: any) {
    const maskSeperator = new RegExp('^([a-zA-Z0-9 (,)+-@#$])', 'g');
    return maskSeperator.test(event.key);
  }
  noSpaceAllow(event: any) {  // for All Space Not Allow
    if (event.code === 'Space') {
        event.preventDefault();
    }
}

  acceptedOnlyNumbers(event: any) {
    const pattern = /[0-9]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  noSpaces(event: any) {
    const maskSeperator = new RegExp('^[ ]+|[ ]+$', 'gm');
    return !maskSeperator.test(event.key);
}
}
