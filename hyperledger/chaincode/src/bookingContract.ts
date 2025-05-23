/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import { Context, Contract, Info, Transaction } from "fabric-contract-api";
import { Booking } from "./booking";

@Info({
  title: "BookingContract",
  description: "Smart contract for recording travel bookings",
})
export class BookingContract extends Contract {
  @Transaction()
  public async RecordBooking(
    ctx: Context,
    bookingID: string,
    createdAt: string,
    updatedAt: string,
    cancelledAt: string,
    userHash: string,
    isUserAnonymous: boolean,
    userID: string,
    agencyID: string,
    travelID: number,
    seatNumbers: string, // Pass as comma-separated string
    totalPrice: number,
    transactionID: string,
    status: string,
    refundAmount: number,
    penalty: number,
    availableSeats: number
  ): Promise<void> {
    const booking = new Booking();
    booking.bookingID = bookingID;
    booking.createdAt = createdAt;
    booking.updatedAt = updatedAt;
    booking.cancelledAt = cancelledAt;
    booking.userHash = userHash;
    booking.isUserAnonymous = isUserAnonymous;
    booking.userID = userID;
    booking.agencyID = agencyID;
    booking.travelID = travelID;
    booking.seatNumbers = seatNumbers;
    booking.totalPrice = totalPrice;
    booking.transactionID = transactionID;
    booking.status = status;
    booking.refundAmount = refundAmount;
    booking.penalty = penalty;
    booking.availableSeats = availableSeats;
    booking.hyperledgerTxId = ctx.stub.getTxID();

    console.log("booking:", booking);

    // const exists = await this.BookingExists(ctx, booking.bookingID);
    // if (exists) {
    //   throw new Error(`Booking ${booking.bookingID} already exists`);
    // }

    await ctx.stub.putState(
      booking.bookingID,
      Buffer.from(JSON.stringify(booking))
    );
  }

  @Transaction(false)
  public async ReadBooking(ctx: Context, bookingID: string): Promise<string> {
    const data = await ctx.stub.getState(bookingID);
    if (data.length === 0) {
      throw new Error(`Booking ${bookingID} does not exist`);
    }
    return data.toString();
  }

  @Transaction(false)
  public async BookingExists(
    ctx: Context,
    bookingID: string
  ): Promise<boolean> {
    const data = await ctx.stub.getState(bookingID);
    return data.length > 0;
  }

  @Transaction(false)
  public async GetAllBookings(ctx: Context): Promise<string> {
    const iterator = await ctx.stub.getStateByRange("", "");
    const bookings = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      try {
        bookings.push(JSON.parse(strValue));
      } catch (e) {
        bookings.push(strValue);
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(bookings);
  }

  @Transaction()
  public async DeleteBooking(ctx: Context, bookingID: string): Promise<void> {
    const exists = await this.BookingExists(ctx, bookingID);
    if (!exists) {
      throw new Error(`The booking ${bookingID} does not exist`);
    }
    return ctx.stub.deleteState(bookingID);
  }
}
