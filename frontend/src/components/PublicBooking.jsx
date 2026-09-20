import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import StepProgress from './booking/StepProgress';
import StepGuests from './booking/StepGuests';
import StepDate from './booking/StepDate';
import StepTime from './booking/StepTime';
import StepTable from './booking/StepTable';
import StepDetails from './booking/StepDetails';

const DAY_NAMES_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const MONTH_NAMES_SHORT = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY_NAMES_SHORT[dt.getDay()]} ${d}. ${MONTH_NAMES_SHORT[m - 1]}`;
}

function PublicBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const [guests, setGuests] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+47');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const goToStep = (step) => {
    if (step < currentStep) setCurrentStep(step);
  };

  const steps = [
    { key: 'guests', placeholder: 'Antall personer', value: guests ? `${guests} ${guests === 1 ? 'person' : 'personer'}` : null },
    { key: 'date', placeholder: 'Velg dato', value: formatShortDate(date) },
    { key: 'time', placeholder: 'Velg tid', value: time || null },
    { key: 'table', placeholder: 'Velg bord', value: selectedTable ? `Bord ${selectedTable.name}` : null },
    { key: 'details', placeholder: 'Dine detaljer', value: null },
  ];

  return (
    <div className={`flex flex-col ${isSuccess ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header />

      <main className="flex-grow p-4 md:p-8 flex flex-col items-center">
        {!isSuccess && (
          <StepProgress steps={steps} currentStep={currentStep} onStepClick={goToStep} />
        )}

        <div className="w-full max-w-6xl flex-grow flex flex-col">
          {currentStep === 1 && (
            <StepGuests
              guests={guests}
              onNext={(val) => { setGuests(val); setCurrentStep(2); }}
            />
          )}

          {currentStep === 2 && (
            <StepDate
              date={date}
              onNext={(val) => { setDate(val); setCurrentStep(3); }}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepTime
              date={date}
              time={time}
              onNext={(val) => { setTime(val); setCurrentStep(4); }}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <StepTable
              date={date}
              time={time}
              guests={guests}
              selectedTable={selectedTable}
              onClearSelectedTable={() => setSelectedTable(null)}
              onNext={(table) => { setSelectedTable(table); setCurrentStep(5); }}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <StepDetails
              date={date}
              time={time}
              guests={guests}
              selectedTable={selectedTable}
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              phone={phone} setPhone={setPhone}
              countryCode={countryCode} setCountryCode={setCountryCode}
              additionalInfo={additionalInfo} setAdditionalInfo={setAdditionalInfo}
              onBack={() => setCurrentStep(4)}
              onSuccess={() => setIsSuccess(true)}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PublicBooking;
