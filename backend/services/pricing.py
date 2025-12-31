"""
Content Localization & AI Tutorial Platform
Pricing Calculator Service

Calculates job prices and deadlines based on content metrics.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP


class ComplexityLevel(str, Enum):
    """Complexity levels for job pricing."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


@dataclass
class PricingConfig:
    """Configurable pricing parameters."""
    rate_per_word: Decimal = Decimal("0.05")  # VND or configured currency
    rate_per_minute: Decimal = Decimal("5.00")
    
    # Complexity multipliers
    complexity_multipliers: dict = None
    
    # Re-record bonus (derivative work requirement)
    re_record_bonus_percent: Decimal = Decimal("30.00")
    
    # Base deadline in hours
    base_deadline_hours: int = 6
    
    def __post_init__(self):
        if self.complexity_multipliers is None:
            self.complexity_multipliers = {
                ComplexityLevel.EASY: Decimal("1.0"),
                ComplexityLevel.MEDIUM: Decimal("1.25"),
                ComplexityLevel.HARD: Decimal("1.5"),
                ComplexityLevel.EXPERT: Decimal("2.0"),
            }


@dataclass
class PricingResult:
    """Result of pricing calculation."""
    word_count: int
    video_duration_seconds: int
    video_duration_minutes: float
    is_re_record: bool
    complexity_level: ComplexityLevel
    
    # Pricing breakdown
    word_price: Decimal
    duration_price: Decimal
    base_price: Decimal
    complexity_bonus: Decimal
    re_record_bonus: Decimal
    final_price: Decimal
    
    # Deadline
    deadline_hours: int
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "word_count": self.word_count,
            "video_duration_seconds": self.video_duration_seconds,
            "video_duration_minutes": self.video_duration_minutes,
            "is_re_record": self.is_re_record,
            "complexity_level": self.complexity_level.value,
            "pricing_breakdown": {
                "word_price": str(self.word_price),
                "duration_price": str(self.duration_price),
                "base_price": str(self.base_price),
                "complexity_bonus": str(self.complexity_bonus),
                "re_record_bonus": str(self.re_record_bonus),
            },
            "final_price": str(self.final_price),
            "deadline_hours": self.deadline_hours,
        }
    
    def to_jsonb(self) -> dict:
        """Convert to JSONB format for database storage."""
        return {
            "word_count": self.word_count,
            "rate_per_word": str(self.word_price / self.word_count) if self.word_count > 0 else "0",
            "video_duration_minutes": self.video_duration_minutes,
            "rate_per_minute": str(self.duration_price / Decimal(str(self.video_duration_minutes))) if self.video_duration_minutes > 0 else "0",
            "complexity_multiplier": self.complexity_level.value,
            "re_record_bonus": str(self.re_record_bonus),
            "base_price": str(self.base_price),
            "final_price": str(self.final_price),
        }


class PricingCalculator:
    """
    Calculates job pricing based on content metrics.
    
    Formula:
        base_price = (word_count * rate_per_word) + (video_duration_minutes * rate_per_minute)
        complexity_bonus = base_price * (complexity_multiplier - 1)
        re_record_bonus = base_price * 0.3 if is_re_record else 0
        final_price = base_price + complexity_bonus + re_record_bonus
        
        deadline_hours = base_hours + (word_count / 1000) + (video_duration_hours)
    """
    
    def __init__(self, config: Optional[PricingConfig] = None):
        """
        Initialize the pricing calculator.
        
        Args:
            config: Optional custom pricing configuration.
                   Defaults to standard rates if not provided.
        """
        self.config = config or PricingConfig()
    
    def calculate(
        self,
        text_length: int,
        video_duration: int,  # in seconds
        is_re_record: bool = True,
        complexity_level: str | ComplexityLevel = "medium"
    ) -> PricingResult:
        """
        Calculate the final price and deadline for a job.
        
        Args:
            text_length: Word count of the content to translate.
            video_duration: Video duration in seconds.
            is_re_record: Whether derivative work (re-recording) is required.
            complexity_level: Complexity level ('easy', 'medium', 'hard', 'expert').
        
        Returns:
            PricingResult with full breakdown and deadline.
        
        Raises:
            ValueError: If complexity_level is invalid.
        
        Examples:
            >>> calculator = PricingCalculator()
            >>> result = calculator.calculate(
            ...     text_length=1000,
            ...     video_duration=600,  # 10 minutes
            ...     is_re_record=True,
            ...     complexity_level="medium"
            ... )
            >>> print(result.final_price)
        """
        # Normalize complexity level
        if isinstance(complexity_level, str):
            try:
                complexity_level = ComplexityLevel(complexity_level.lower())
            except ValueError:
                raise ValueError(
                    f"Invalid complexity level: {complexity_level}. "
                    f"Must be one of: {[c.value for c in ComplexityLevel]}"
                )
        
        # Convert video duration to minutes
        video_duration_minutes = Decimal(str(video_duration)) / Decimal("60")
        
        # Calculate word-based price
        word_price = Decimal(str(text_length)) * self.config.rate_per_word
        
        # Calculate duration-based price
        duration_price = video_duration_minutes * self.config.rate_per_minute
        
        # Base price
        base_price = word_price + duration_price
        
        # Complexity bonus
        multiplier = self.config.complexity_multipliers.get(
            complexity_level, 
            Decimal("1.0")
        )
        complexity_bonus = base_price * (multiplier - Decimal("1.0"))
        
        # Re-record bonus (derivative work requirement)
        re_record_bonus = Decimal("0")
        if is_re_record:
            re_record_bonus = base_price * (self.config.re_record_bonus_percent / Decimal("100"))
        
        # Final price (rounded to 2 decimal places)
        final_price = (base_price + complexity_bonus + re_record_bonus).quantize(
            Decimal("0.01"), 
            rounding=ROUND_HALF_UP
        )
        
        # Calculate deadline
        # Base hours + 1 hour per 1000 words + video duration in hours
        video_hours = video_duration / 3600  # Convert seconds to hours
        word_hours = text_length / 1000  # 1 hour per 1000 words
        deadline_hours = int(
            self.config.base_deadline_hours + 
            word_hours + 
            video_hours
        )
        # Ensure minimum deadline
        deadline_hours = max(deadline_hours, self.config.base_deadline_hours)
        
        return PricingResult(
            word_count=text_length,
            video_duration_seconds=video_duration,
            video_duration_minutes=float(video_duration_minutes),
            is_re_record=is_re_record,
            complexity_level=complexity_level,
            word_price=word_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            duration_price=duration_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            base_price=base_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            complexity_bonus=complexity_bonus.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            re_record_bonus=re_record_bonus.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            final_price=final_price,
            deadline_hours=deadline_hours,
        )
    
    @staticmethod
    def estimate_word_count(text: str) -> int:
        """
        Estimate word count from text.
        
        For Chinese text, counts characters (1 char ≈ 1 word).
        For English/Vietnamese, counts space-separated words.
        
        Args:
            text: The text to analyze.
        
        Returns:
            Estimated word count.
        """
        if not text:
            return 0
        
        # Check if text is primarily Chinese (contains CJK characters)
        cjk_count = sum(1 for char in text if '\u4e00' <= char <= '\u9fff')
        total_chars = len(text.replace(" ", ""))
        
        if cjk_count > total_chars * 0.3:  # More than 30% CJK
            # For Chinese, each character is roughly a word
            return cjk_count + len(text.split())
        else:
            # For other languages, count space-separated words
            return len(text.split())


# Convenience function for quick calculations
def calculate_job_price(
    text_length: int,
    video_duration: int,
    is_re_record: bool = True,
    complexity_level: str = "medium",
    config: Optional[PricingConfig] = None
) -> PricingResult:
    """
    Convenience function to calculate job pricing.
    
    See PricingCalculator.calculate() for full documentation.
    """
    calculator = PricingCalculator(config)
    return calculator.calculate(
        text_length=text_length,
        video_duration=video_duration,
        is_re_record=is_re_record,
        complexity_level=complexity_level
    )


if __name__ == "__main__":
    # Example usage and testing
    print("=" * 60)
    print("Content Localization Pricing Calculator - Test")
    print("=" * 60)
    
    calculator = PricingCalculator()
    
    # Test case 1: Simple job
    result = calculator.calculate(
        text_length=500,
        video_duration=300,  # 5 minutes
        is_re_record=True,
        complexity_level="easy"
    )
    print("\n[Test 1] Simple job (500 words, 5min video, easy):")
    print(f"  Final Price: {result.final_price}")
    print(f"  Deadline: {result.deadline_hours} hours")
    
    # Test case 2: Medium complexity job
    result = calculator.calculate(
        text_length=2000,
        video_duration=1800,  # 30 minutes
        is_re_record=True,
        complexity_level="medium"
    )
    print("\n[Test 2] Medium job (2000 words, 30min video, medium):")
    print(f"  Final Price: {result.final_price}")
    print(f"  Deadline: {result.deadline_hours} hours")
    
    # Test case 3: Complex AI tutorial
    result = calculator.calculate(
        text_length=5000,
        video_duration=3600,  # 60 minutes
        is_re_record=True,
        complexity_level="expert"
    )
    print("\n[Test 3] Expert tutorial (5000 words, 60min video, expert):")
    print(f"  Final Price: {result.final_price}")
    print(f"  Deadline: {result.deadline_hours} hours")
    print(f"\n  Full breakdown: {result.to_dict()}")
