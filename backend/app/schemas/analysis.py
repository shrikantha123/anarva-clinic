"""AI analysis contract.

These models are the response schema sent to Gemini *and* the validator for what comes back,
so nothing reaches the frontend without passing them. Numbers are clamped into range,
hair-loss percentages are normalised to total exactly 100, and image validity is recomputed.
"""
import math
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, BeforeValidator, Field, field_validator, model_validator

from app.images import MAX_BYTES

MAX_TEXT = 2000
REJECTION_FALLBACK = "This photo cannot be used for hair analysis. Please retake it following the on-screen guide."
SLOTS = ("front", "mid", "crown")


def _number(low: float, high: float, digits: int = 0) -> BeforeValidator:
    def clamp(value):
        if isinstance(value, bool) or not isinstance(value, (int, float, str)):
            raise ValueError("expected a number")
        number = float(value)
        if not math.isfinite(number):
            raise ValueError("expected a finite number")
        number = min(high, max(low, round(number, digits)))
        return int(number) if digits == 0 else number

    return BeforeValidator(clamp)


def _text(min_length: int) -> AfterValidator:
    def clean(value: str) -> str:
        value = value.strip()
        if len(value) < min_length:
            raise ValueError("text must not be empty")
        return value[:MAX_TEXT]

    return AfterValidator(clean)


Pct = Annotated[int, _number(0, 100)]
ReasonPct = Annotated[int, _number(5, 100)]
Stage = Annotated[int, _number(1, 7)]
Density = Annotated[float, _number(0, 10, 1)]
Text = Annotated[str, _text(1)]
Note = Annotated[str, _text(0)]  # may be empty
Urgency = Annotated[
    Literal["low", "medium", "high"],
    BeforeValidator(lambda v: v.strip().lower() if isinstance(v, str) else v),
]


class ImageCheck(BaseModel):
    is_valid: bool
    angle_correct: bool
    quality_pass: bool
    rejection_reason: str | None

    @model_validator(mode="after")
    def _reason_only_when_rejected(self):
        reason = (self.rejection_reason or "").strip()
        self.rejection_reason = None if self.is_valid else (reason or REJECTION_FALLBACK)
        return self


class ImageValidation(BaseModel):
    all_valid: bool
    front: ImageCheck
    mid: ImageCheck
    crown: ImageCheck

    @model_validator(mode="after")
    def _recompute_all_valid(self):
        self.all_valid = self.front.is_valid and self.mid.is_valid and self.crown.is_valid
        return self


class HairLossReason(BaseModel):
    reason: Text
    percentage: ReasonPct
    explanation: Note


class ScalpFinding(BaseModel):
    condition: Literal[
        "flaking",
        "seborrhoeic changes",
        "erythema",
        "folliculitis",
        "miniaturisation",
        "scarring signs",
        "patchy loss",
        "other visible sign",
    ]
    severity_pct: Pct
    observation: Note


class Consultation(BaseModel):
    urgency: Urgency
    confidence_pct: Pct
    reason: Text
    recommended_timeframe: Note


class Treatment(BaseModel):
    probability_pct: Pct
    trigger: Note
    description: Note


class DoctorTreatments(BaseModel):
    prp: Treatment
    gfc: Treatment
    medical_therapy: Treatment
    hair_transplant: Treatment
    topical_care: Treatment


class NextStep(BaseModel):
    title: Text
    description: Note


class Analysis(BaseModel):
    norwood_stage: Stage
    stage_name: Text
    stage_description: Note
    front_density: Density
    mid_density: Density
    crown_density: Density
    overall_health_score: Pct
    follicular_health_pct: Pct
    dandruff_index: Pct
    sebum_oiliness_index: Pct
    flaking_level: Pct
    redness_index: Pct
    scalp_irritation_index: Pct
    hair_loss_reasons: list[HairLossReason] = Field(min_length=1, max_length=5)
    scalp_findings: list[ScalpFinding]
    clinical_observations: list[Note] = Field(min_length=1, max_length=6)
    consultation: Consultation
    next_steps: list[NextStep] = Field(min_length=3, max_length=4)
    doctor_treatments: DoctorTreatments
    doctor_clinical_brief: Note
    overall_confidence_pct: Pct
    limitations: Note | None

    @field_validator("hair_loss_reasons")
    @classmethod
    def _total_exactly_100(cls, reasons):
        if not 1 <= len(reasons) <= 5:
            raise ValueError("hair_loss_reasons must contain between 1 and 5 items")
        total = sum(r.percentage for r in reasons)
        if total <= 0:
            raise ValueError("hair_loss_reasons needs at least one positive percentage")
        distributable = 100 - 5 * len(reasons)
        exact = [r.percentage * distributable / total for r in reasons]
        shares = [5 + int(x) for x in exact]
        # Largest-remainder method: hand the leftover points to the biggest fractions.
        by_fraction = sorted(range(len(reasons)), key=lambda i: exact[i] - shares[i], reverse=True)
        for i in by_fraction[: 100 - sum(shares)]:
            shares[i] += 1
        return [r.model_copy(update={"percentage": s}) for r, s in zip(reasons, shares)]

    @field_validator("clinical_observations")
    @classmethod
    def _drop_empty(cls, items):
        observations = [item for item in items if item]
        if not 1 <= len(observations) <= 6:
            raise ValueError("clinical_observations must contain between 1 and 6 non-empty items")
        return observations

    @field_validator("limitations")
    @classmethod
    def _empty_to_none(cls, value):
        return value or None


class AnalyzeResult(BaseModel):
    image_validation: ImageValidation
    analysis: Analysis | None

    @model_validator(mode="after")
    def _analysis_iff_all_valid(self):
        if not self.image_validation.all_valid:
            self.analysis = None  # rejected photos never come with a diagnosis
        elif self.analysis is None:
            raise ValueError("analysis is required when every image is valid")
        return self


class QuizAnswers(BaseModel):
    """Patient questionnaire (mirrors src/types.ts). Untrusted input: bounded and typed."""

    q1_onset: str = Field("", max_length=100)
    q2_progression: str = Field("", max_length=100)
    q3_locations: list[Annotated[str, Field(max_length=100)]] = Field(default_factory=list, max_length=20)
    q4_shedding: int = Field(2, ge=0, le=4)
    q5_family: list[Annotated[str, Field(max_length=100)]] = Field(default_factory=list, max_length=20)
    q6_events: list[Annotated[str, Field(max_length=100)]] = Field(default_factory=list, max_length=20)
    q6_timing: str = Field("", max_length=100)
    q7_symptoms: list[Annotated[str, Field(max_length=100)]] = Field(default_factory=list, max_length=20)
    q8_treatments: list[Annotated[str, Field(max_length=100)]] = Field(default_factory=list, max_length=20)
    q8_duration: str = Field("", max_length=100)


class Photos(BaseModel):
    """Front, Mid/Top and Crown photos as data URIs. Content is checked in app.images."""

    front: str = Field(min_length=1, max_length=MAX_BYTES * 2)
    mid: str = Field(min_length=1, max_length=MAX_BYTES * 2)
    crown: str = Field(min_length=1, max_length=MAX_BYTES * 2)


class AnalyzeRequest(BaseModel):
    model_config = {"populate_by_name": True}

    photos: Photos
    quiz_answers: QuizAnswers = Field(default_factory=QuizAnswers, alias="quizAnswers")
