import pytest
from pydantic import ValidationError

from app.schemas.analysis import Analysis


def _analysis_payload():
    treatment = {"probability_pct": 50, "trigger": "", "description": ""}
    return {
        "norwood_stage": 2,
        "stage_name": "Stage 2",
        "stage_description": "Mild recession is visible.",
        "front_density": 7,
        "mid_density": 7,
        "crown_density": 7,
        "overall_health_score": 70,
        "follicular_health_pct": 70,
        "dandruff_index": 0,
        "sebum_oiliness_index": 0,
        "flaking_level": 0,
        "redness_index": 0,
        "scalp_irritation_index": 0,
        "hair_loss_reasons": [
            {"reason": "Genetic pattern", "percentage": 40, "explanation": "Visible recession."},
            {"reason": "Stress", "percentage": 30, "explanation": "Based on your answers."},
            {"reason": "Other factors", "percentage": 30, "explanation": "Possible contribution."},
        ],
        "scalp_findings": [],
        "clinical_observations": ["Observation one", "Observation two", "Observation three"],
        "consultation": {
            "urgency": "low",
            "confidence_pct": 70,
            "reason": "No urgent signs are visible.",
            "recommended_timeframe": "Routine consultation.",
        },
        "next_steps": [
            {"title": "Step one", "description": "First action."},
            {"title": "Step two", "description": "Second action."},
            {"title": "Step three", "description": "Third action."},
        ],
        "doctor_treatments": {
            "prp": treatment,
            "gfc": treatment,
            "medical_therapy": treatment,
            "hair_transplant": treatment,
            "topical_care": treatment,
        },
        "doctor_clinical_brief": "Mild visible recession.",
        "overall_confidence_pct": 70,
        "limitations": None,
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("hair_loss_reasons", []),
        ("clinical_observations", []),
        ("next_steps", []),
        ("next_steps", [{"title": "Only one step", "description": "An action."}]),
    ],
)
def test_analysis_rejects_incomplete_required_lists(field, value):
    payload = _analysis_payload()
    payload[field] = value

    with pytest.raises(ValidationError):
        Analysis.model_validate(payload)


def test_analysis_rejects_reason_percentage_below_five():
    payload = _analysis_payload()
    payload["hair_loss_reasons"][0]["percentage"] = 100
    payload["hair_loss_reasons"][1]["percentage"] = 0
    payload["hair_loss_reasons"][2]["percentage"] = 0

    analysis = Analysis.model_validate(payload)
    percentages = [reason.percentage for reason in analysis.hair_loss_reasons]

    assert len(percentages) == 3
    assert min(percentages) >= 5
    assert sum(percentages) == 100


def test_analysis_allows_one_evidence_supported_reason():
    payload = _analysis_payload()
    payload["hair_loss_reasons"] = [
        {"reason": "Visible pattern", "percentage": 100, "explanation": "Supported by the photos."}
    ]

    analysis = Analysis.model_validate(payload)

    assert len(analysis.hair_loss_reasons) == 1
    assert analysis.hair_loss_reasons[0].percentage == 100


def test_analysis_rejects_too_few_observations_after_empty_cleanup():
    payload = _analysis_payload()
    payload["clinical_observations"] = ["", "", "", ""]

    with pytest.raises(ValidationError):
        Analysis.model_validate(payload)


def test_analysis_rejects_unrecognized_scalp_finding():
    payload = _analysis_payload()
    payload["scalp_findings"] = [
        {"condition": "unlisted condition", "severity_pct": 20, "observation": "Visible on crown."}
    ]

    with pytest.raises(ValidationError):
        Analysis.model_validate(payload)


def test_analysis_allows_one_factual_observation():
    payload = _analysis_payload()
    payload["clinical_observations"] = ["One visible feature."]

    analysis = Analysis.model_validate(payload)

    assert analysis.clinical_observations == ["One visible feature."]