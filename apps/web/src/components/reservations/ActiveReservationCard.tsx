"use client";

import Link from "next/link";
import { ExternalLinkIcon as ExternalLink, ImageIcon, UploadIcon as Upload } from "@radix-ui/react-icons";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { resolveApiAsset } from "@/lib/assets";
import type { Payment, ReservationWithItems } from "@/lib/account";
import type { ReservationAdjustment } from "@/lib/fulfillment";
import { countRentalDaysInclusive } from "@/lib/pricing";
import {
  buildReserveAgainHref,
  currentJourneyStep,
  formatReservationDate,
  getJourneyStepMeta,
  getPaidAdjustmentTotal,
  getPendingAdjustment,
  hasActivePaymentForAdjustment,
  hasActivePaymentForReservation,
  reservationFulfillmentSummary,
  resolvePaymentHistoryStatus,
  resolveReservationStatus,
  timelineForReservation,
  timelineStepState
} from "@/lib/reservationDisplay";
import { PAYMENT_PURPOSE_LABELS } from "@/lib/reservationStatus";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

interface ActiveReservationCardProps {
  reservation: ReservationWithItems;
  reservationPayments: Payment[];
  handoffActionId: number | null;
  uploadingAdjustmentId: number | null;
  onOpenCart: () => void;
  onCancel: () => void;
  onConfirmReceived: () => void;
  onInitiateReturn: () => void;
  onUploadAdjustment: (adjustment: ReservationAdjustment) => void;
  onHandoffFileChange: (file: File | null) => void;
  onAdjustmentFileChange: (file: File | null) => void;
}

export function ActiveReservationCard({
  reservation,
  reservationPayments,
  handoffActionId,
  uploadingAdjustmentId,
  onOpenCart,
  onCancel,
  onConfirmReceived,
  onInitiateReturn,
  onUploadAdjustment,
  onHandoffFileChange,
  onAdjustmentFileChange
}: ActiveReservationCardProps) {
  const firstItem = reservation.items?.[0];
  const title = firstItem?.Costume?.name || `Reservation #${reservation.id}`;
  const image =
    firstItem?.Costume?.CostumeImages?.find((img) => img.is_primary)?.image_url ||
    firstItem?.Costume?.CostumeImages?.[0]?.image_url ||
    "";
  const days =
    reservation.start_date && reservation.end_date
      ? countRentalDaysInclusive(reservation.start_date, reservation.end_date)
      : 0;
  const status = resolveReservationStatus(reservation, reservationPayments);
  const reserveAgainHref = buildReserveAgainHref(reservation);
  const canContinuePayment =
    reservation.status === "PENDING_PAYMENT" && !hasActivePaymentForReservation(reservationPayments);
  const fulfillmentLine = reservationFulfillmentSummary(reservation);
  const pendingAdjustment = getPendingAdjustment(reservation);
  const paidSurchargeTotal = getPaidAdjustmentTotal(reservation);
  const journey = timelineForReservation(reservation);
  const journeyCurrentStep = currentJourneyStep(reservation, reservationPayments);
  const journeyIndex = journey.indexOf(journeyCurrentStep);
  const showsJourney = journeyIndex >= 0;
  const nextJourneyStep = showsJourney ? journey[journeyIndex + 1] : undefined;
  const journeyCompletion = showsJourney ? ((journeyIndex + 1) / journey.length) * 100 : 0;

  const fileInputClass =
    "block w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest";

  return (
    <article className="panel-card shadow-coral-hover overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="reservation-spotlight relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-muted lg:w-44 xl:w-52">
          {image ? (
            <img
              src={resolveApiAsset(image)}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <ImageIcon className="size-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-ink/80 via-brand-ink/40 to-transparent px-4 pb-4 pt-12">
            <span
              className={cn(
                "inline-flex rounded-lg border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest backdrop-blur-sm",
                status.className,
                "bg-background/90"
              )}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                #{reservation.id}
              </p>
              <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {reservation.start_date && reservation.end_date
                  ? `${formatReservationDate(reservation.start_date)} – ${formatReservationDate(reservation.end_date)}`
                  : "Dates pending"}
                {days > 0 && ` · ${days} day${days !== 1 ? "s" : ""}`}
              </p>
              {fulfillmentLine ? (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {fulfillmentLine}
                </p>
              ) : null}
            </div>

            <p className="shrink-0 font-display text-2xl font-semibold tabular-nums text-primary sm:text-right">
              PHP {(Number(reservation.total_price) + paidSurchargeTotal).toLocaleString()}
            </p>
          </div>

          {paidSurchargeTotal > 0 ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              Includes PHP {paidSurchargeTotal.toLocaleString()} in settled surcharge payments
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {canContinuePayment ? (
              <Button type="button" size="sm" className={actionLabelClass} onClick={onOpenCart}>
                <Upload data-icon="inline-start" />
                Continue payment
              </Button>
            ) : null}

            {reservation.status === "PENDING_PAYMENT" &&
            !hasActivePaymentForReservation(reservationPayments) ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className={actionLabelClass}
                onClick={onCancel}
                disabled={handoffActionId === reservation.id}
              >
                Cancel reservation
              </Button>
            ) : null}

            {firstItem?.costume_id ? (
              <Link
                href={`/costumes/${firstItem.costume_id}`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), actionLabelClass)}
              >
                View costume
              </Link>
            ) : null}

            {reservation.status === "CANCELLED" && reserveAgainHref ? (
              <Link
                href={reserveAgainHref}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), actionLabelClass)}
              >
                Change dates & reserve again
              </Link>
            ) : null}
          </div>

          {showsJourney ? (
            <section className="space-y-4 rounded-xl border border-border bg-muted/30 p-4" aria-label="Fulfillment progress">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Call sheet · Stage {journeyIndex + 1} of {journey.length}
                </p>
                {nextJourneyStep ? (
                  <p className="text-right text-xs text-muted-foreground">
                    Next:{" "}
                    <span className="font-medium text-foreground">
                      {getJourneyStepMeta(nextJourneyStep, reservation.fulfillment || undefined).label}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-medium text-primary">Complete</p>
                )}
              </div>

              <div className="reservation-journey-rail h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${journeyCompletion}%` }}
                />
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value={`journey-${reservation.id}`} className="border-b-0">
                  <AccordionTrigger className="py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    Full journey
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="grid gap-x-6 gap-y-2 pt-2 sm:grid-cols-2">
                      {journey.map((step, index) => {
                        const meta = getJourneyStepMeta(step, reservation.fulfillment || undefined);
                        const state = timelineStepState(journeyCurrentStep, journey, step);
                        return (
                          <li key={step} className="flex items-center gap-3 text-xs">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums",
                                state === "current" && "bg-primary text-primary-foreground",
                                state === "complete" && "bg-brand-coral-soft text-primary",
                                state === "upcoming" && "border border-border bg-background text-muted-foreground"
                              )}
                            >
                              {index + 1}
                            </span>
                            <span
                              className={cn(
                                state === "current" && "font-semibold text-foreground",
                                state !== "current" && "text-muted-foreground"
                              )}
                            >
                              {meta.label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          ) : null}

          {reservation.fulfillment &&
          [
            ["Dispatch", reservation.fulfillment.outbound_dispatch_proof_url],
            ["Received", reservation.fulfillment.renter_received_proof_url],
            ["Return started", reservation.fulfillment.return_initiated_proof_url],
            ["Vendor return", reservation.fulfillment.vendor_return_proof_url]
          ].some(([, proof]) => proof) ? (
            <div className="flex flex-wrap gap-2">
              {[
                ["Dispatch", reservation.fulfillment.outbound_dispatch_proof_url],
                ["Received", reservation.fulfillment.renter_received_proof_url],
                ["Return started", reservation.fulfillment.return_initiated_proof_url],
                ["Vendor return", reservation.fulfillment.vendor_return_proof_url]
              ]
                .filter(([, proof]) => proof)
                .map(([label, proof]) => (
                  <a
                    key={label}
                    href={resolveApiAsset(proof!)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), actionLabelClass)}
                  >
                    {label} proof
                  </a>
                ))}
            </div>
          ) : null}

          {reservation.fulfillment?.outside_service_area ? (
            <div className="rounded-xl border border-orange-400/30 bg-orange-50/50 p-4 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
              This booking was flagged as outside the vendor&apos;s service area. A surcharge may be requested during
              review.
            </div>
          ) : null}

          {reservation.status === "DELIVERY_SCHEDULED" ? (
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Confirm receipt</p>
              <p className="text-sm text-muted-foreground">
                Upload a photo showing the costume in your possession. Required before the rental period begins.
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => onHandoffFileChange(event.target.files?.[0] || null)}
                className={fileInputClass}
              />
              <Button
                type="button"
                className={actionLabelClass}
                onClick={onConfirmReceived}
                disabled={handoffActionId === reservation.id}
              >
                {handoffActionId === reservation.id ? "Submitting..." : "Confirm I received it"}
              </Button>
            </div>
          ) : null}

          {reservation.status === "WITH_RENTER" ? (
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Return costume</p>
              <p className="text-sm text-muted-foreground">
                Upload a photo of the costume as you prepare to return it.
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => onHandoffFileChange(event.target.files?.[0] || null)}
                className={fileInputClass}
              />
              <Button
                type="button"
                className={actionLabelClass}
                onClick={onInitiateReturn}
                disabled={handoffActionId === reservation.id}
              >
                {handoffActionId === reservation.id ? "Submitting..." : "Return costume"}
              </Button>
            </div>
          ) : null}

          {pendingAdjustment ? (
            <div className="space-y-4 rounded-xl border border-orange-400/30 bg-orange-50/50 p-4 dark:bg-orange-900/10">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400">
                  Supplemental payment requested
                </p>
                <p className="font-display text-lg font-semibold text-foreground">
                  PHP {Number(pendingAdjustment.amount).toLocaleString()}
                </p>
                {pendingAdjustment.note ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{pendingAdjustment.note}</p>
                ) : null}
              </div>

              {hasActivePaymentForAdjustment(pendingAdjustment.id, reservationPayments) ? (
                <p className="text-xs text-muted-foreground">
                  A supplemental receipt has already been submitted for review.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) => onAdjustmentFileChange(event.target.files?.[0] || null)}
                    className={fileInputClass}
                  />
                  <Button
                    type="button"
                    className={cn("shrink-0", actionLabelClass)}
                    onClick={() => onUploadAdjustment(pendingAdjustment)}
                    disabled={uploadingAdjustmentId === pendingAdjustment.id}
                  >
                    {uploadingAdjustmentId === pendingAdjustment.id ? "Uploading..." : "Upload supplemental proof"}
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {reservationPayments.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Payment history
              </p>
              {reservationPayments.map((payment) => {
                const paymentStatus = resolvePaymentHistoryStatus(payment, reservation);
                return (
                  <div key={payment.id} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-md", paymentStatus.className)}>
                          {paymentStatus.label}
                        </Badge>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {PAYMENT_PURPOSE_LABELS[payment.payment_purpose]}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          PHP {Number(payment.amount).toLocaleString()}
                        </span>
                      </div>
                      {payment.proof_url ? (
                        <a
                          href={resolveApiAsset(payment.proof_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View proof <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                    {payment.reservationAdjustment?.note ? (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {payment.reservationAdjustment.note}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
