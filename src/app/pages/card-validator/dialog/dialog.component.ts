import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { ConfirmationDialogComponent } from '../../../modules/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {

  constructor(
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private API: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<DialogComponent>
  ) { }

  creditCardInputForm: FormGroup = new FormGroup({})
  countries: { name: string; code: string; }[] = []
  bannedCountries: string[] = []

  ngOnInit(): void {
    this.creditCardInputForm.addControl("cardNumber", this.formBuilder.control(this.data ? this.data.cardNumber : '', [Validators.required, this.creditCardValidator()]))
    this.creditCardInputForm.addControl("provider", this.formBuilder.control(this.data ? this.data.provider : '', [Validators.required]))
    this.creditCardInputForm.addControl("country", this.formBuilder.control(this.data ? this.data.country : '', [Validators.required]))

    this.countries = this.API.getAllCountries()
    this.bannedCountries = this.API.getAllBannedCountries()

    this.countries = this.countries.filter((value) => {
      return !this.bannedCountries.includes(value.name);
    });
  }

  onSubmit(x: any) {
    let storeValue =
      JSON.stringify(
        {
          "cardNumber": x.value['cardNumber'],
          "provider": x.value['provider'],
          "country": x.value['country']
        }
      )

    sessionStorage.setItem("cardNumber_" + x.value['cardNumber'], x.value['cardNumber'])

    this.API.getDataValidatedCard(x.value['cardNumber']) && !this.data ?
      this.throwAlreadyExistError() : (
        this.API.insertValidatedCard(x.value['cardNumber'], storeValue),
        this.dialogRef.close()
      )
  }

  throwAlreadyExistError() {
    const dialogRef2 = this.dialog.open(ConfirmationDialogComponent,
      { data: "Card Number already exists, would you like to try another card number?" });

    dialogRef2.afterClosed().subscribe((result: boolean) => {
      result == true ? (
        null
      ) :
        this.dialogRef.close()
    });
  }

  creditCardValidator(): ValidatorFn {

    return (control: AbstractControl): ValidationErrors | null => {

      if (!control.value) {
        return null;
      }

      let cardNumber = control.value.toString();

      if (!cardNumber.length) {
        return null;
      }

      if (cardNumber.length > 19 || cardNumber.length < 8) {
        return { invalidCreditCardNumberLength: true }
      }

      var nCheck = 0, nDigit = 0, bEven = false;

      for (let i = cardNumber.length - 1; i >= 0; i--) {
        var cDigit = cardNumber.charAt(i),

          nDigit = parseInt(cDigit, 10);

        if (bEven) {
          if ((nDigit *= 2) > 9) nDigit -= 9;
        }

        nCheck += nDigit;
        bEven = !bEven;
      }

      return !((nCheck % 10) == 0) ? { invalidCreditCardNumber: true } : null;
    }
  };
}
