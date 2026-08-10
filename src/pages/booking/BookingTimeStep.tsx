import { useState, useMemo } from 'react';
import { ArrowLeft, PlusCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingTimeStepProps {
    availableTimeSlots: string[];
    bookedSlots: string[];
    selectedDate: string;
    selectedTime: string;
    onSelectDate: (date: string) => void;
    onSelectTime: (time: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function BookingTimeStep({
    availableTimeSlots,
    bookedSlots,
    selectedDate,
    selectedTime,
    onSelectDate,
    onSelectTime,
    onNext,
    onBack
}: BookingTimeStepProps) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [viewDate, setViewDate] = useState(() => {
        if (selectedDate) {
            const [y, m] = selectedDate.split('-').map(Number);
            return new Date(y, m - 1, 1);
        }
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        // Don't allow going back further than the current month
        const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (prev >= minMonth) {
            setViewDate(prev);
        }
    };

    const handleNextMonth = () => {
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        setViewDate(next);
    };

    // Generate days for grid
    const daysGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        // Day of week of 1st day of month (0 = Sun, 1 = Mon, ... 6 = Sat)
        const firstDayIndex = new Date(year, month, 1).getDay();
        // Convert to Mon = 0, Sun = 6
        const startOffset = (firstDayIndex + 6) % 7;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const grid: Array<{
            dayNum: number;
            fullDate: string | null;
            currentMonth: boolean;
            disabled: boolean;
            active: boolean;
        }> = [];

        // Previous month padding
        for (let i = startOffset - 1; i >= 0; i--) {
            grid.push({
                dayNum: prevMonthDays - i,
                fullDate: null,
                currentMonth: false,
                disabled: true,
                active: false
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const cellDate = new Date(year, month, d);
            cellDate.setHours(0, 0, 0, 0);

            const mStr = (month + 1).toString().padStart(2, '0');
            const dStr = d.toString().padStart(2, '0');
            const dateISO = `${year}-${mStr}-${dStr}`;

            const isDisabled = cellDate < today;
            const isActive = selectedDate === dateISO;

            grid.push({
                dayNum: d,
                fullDate: dateISO,
                currentMonth: true,
                disabled: isDisabled,
                active: isActive
            });
        }

        // Next month padding to complete week grid
        const remaining = 7 - (grid.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                grid.push({
                    dayNum: i,
                    fullDate: null,
                    currentMonth: false,
                    disabled: true,
                    active: false
                });
            }
        }

        return grid;
    }, [viewDate, selectedDate, today]);

    // Format sidebar date
    const sidebarDateStr = useMemo(() => {
        if (!selectedDate) return 'Select a date';
        const [y, m, d] = selectedDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' });
    }, [selectedDate]);

    const canGoPrevMonth = viewDate > new Date(today.getFullYear(), today.getMonth(), 1);

    return (
        <div className="booking-time-step">
            <h2 className="step-title mb-6">Select Date & Time</h2>
            
            <div className="time-layout">
                {/* Calendar (Left) */}
                <div className="calendar-col time-card">
                    <div className="calendar-header mb-6">
                        <h3 className="month-title">{monthLabel}</h3>
                        <div className="calendar-nav">
                            <button 
                                type="button"
                                className="nav-btn" 
                                onClick={handlePrevMonth}
                                disabled={!canGoPrevMonth}
                                style={{ opacity: canGoPrevMonth ? 1 : 0.4, cursor: canGoPrevMonth ? 'pointer' : 'not-allowed' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                type="button"
                                className="nav-btn" 
                                onClick={handleNextMonth}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="calendar-weekdays">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    
                    <div className="calendar-grid">
                        {daysGrid.map((d, i) => (
                            <button 
                                key={i}
                                type="button"
                                disabled={d.disabled}
                                className={`calendar-day ${!d.currentMonth ? 'dim' : ''} ${d.active ? 'active' : ''} ${d.disabled ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (d.fullDate && !d.disabled) {
                                        onSelectDate(d.fullDate);
                                    }
                                }}
                            >
                                {d.dayNum}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Slots (Middle) */}
                <div className="time-col time-card">
                    <div className="time-header mb-6">
                        <h3 className="time-title">Available Times</h3>
                        <p className="time-subtitle">{sidebarDateStr}</p>
                    </div>
                    
                    <div className="time-slots-list custom-scrollbar">
                        {!selectedDate ? (
                            <div className="no-date-selected">Please select a date to view available times.</div>
                        ) : availableTimeSlots.length === 0 ? (
                            <div className="no-slots">No available times for this date.</div>
                        ) : (
                            availableTimeSlots.map(time => {
                                const isBooked = bookedSlots.includes(time);
                                const isSelected = selectedTime === time;

                                if (isBooked) {
                                    return (
                                        <button
                                            key={time}
                                            className="time-slot-btn booked"
                                            disabled
                                        >
                                            <span>{time}</span>
                                            <span className="booked-label">Booked</span>
                                        </button>
                                    );
                                }

                                return (
                                    <button 
                                        key={time}
                                        className={`time-slot-btn group ${isSelected ? 'selected' : ''}`}
                                        onClick={() => onSelectTime(time)}
                                    >
                                        <span>{time}</span>
                                        {isSelected ? (
                                            <CheckCircle className="slot-icon selected" />
                                        ) : (
                                            <PlusCircle className="slot-icon unselected opacity-0 group-hover:opacity-100" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className="bottom-actions">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    Back to Stylist
                </button>
                <button 
                    className="confirm-review-btn" 
                    disabled={!selectedDate || !selectedTime}
                    onClick={onNext}
                >
                    Confirm & Review
                </button>
            </div>
        </div>
    );
}
