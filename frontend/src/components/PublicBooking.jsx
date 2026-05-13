import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Step1Calendar from './Step1Calendar';
import Step2FloorPlan from './Step2FloorPlan';

function PublicBooking() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    date: null
  });

  return (
    <div className={`flex flex-col ${isSuccess ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header />
      
      <main className="flex-grow p-4 md:p-8 flex flex-col items-center relative overflow-visible">
        
        {/* Step 1 */}
        <div 
          className={`w-full max-w-6xl transition-all duration-500 ease-in-out transform ${
            step === 1 ? 'relative opacity-100 translate-y-0 z-10 pointer-events-auto' : 'absolute opacity-0 -translate-y-10 z-0 pointer-events-none'
          }`}
        >
           <Step1Calendar onSelect={(date) => {
             setBookingDetails({ date });
             setStep(2);
           }} />
        </div>

        {/* Step 2 */}
        <div 
          className={`w-full max-w-6xl transition-all duration-500 ease-in-out transform flex-grow flex flex-col ${
            step === 2 ? 'opacity-100 translate-y-0 z-10 pointer-events-auto' : 'opacity-0 translate-y-10 z-0 pointer-events-none absolute'
          }`}
        >
           {step === 2 && (
             <Step2FloorPlan 
                bookingDetails={bookingDetails} 
                onBack={() => setStep(1)} 
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
