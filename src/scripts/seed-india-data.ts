import dotenv from 'dotenv';
import path from 'path';

// Load environment variables prior to importing models & DB
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment variables are loaded first before dynamically importing DB & Models

export const indianStatesAndCities = [
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    cities: [
      'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada', 'Tirupati',
      'Rajamahendravaram', 'Kadapa', 'Anantapur', 'Eluru', 'Vizianagaram', 'Machilipatnam',
      'Tenali', 'Ongole', 'Chittoor', 'Srikakulam'
    ],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Tezu', 'Namsai', 'Bomdila'],
  },
  {
    name: 'Assam',
    code: 'AS',
    cities: [
      'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
      'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Karimganj', 'Sivasagar', 'Goalpara'
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    cities: [
      'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif',
      'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Bettiah', 'Saharsa', 'Sasaram',
      'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Nawada'
    ],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    cities: [
      'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur',
      'Ambikapur', 'Dhamtari', 'Mahasamund'
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem'],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    cities: [
      'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
      'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Bharuch', 'Mehsana', 'Bhuj',
      'Porbandar', 'Valsad', 'Vapi'
    ],
  },
  {
    name: 'Haryana',
    code: 'HR',
    cities: [
      'Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
      'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar',
      'Rewari', 'Kaithal', 'Palwal'
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    cities: [
      'Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Baddi', 'Bilaspur', 'Hamirpur', 'Una',
      'Kullu', 'Chamba', 'Palampur', 'Paonta Sahib'
    ],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    cities: [
      'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh',
      'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Phusro'
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    cities: [
      'Bengaluru', 'Mysore', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Davanagere',
      'Ballari', 'Kalaburagi', 'Shimoga', 'Tumakuru', 'Raichur', 'Bidar', 'Udupi', 'Hassan',
      'Hospet', 'Gadag'
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    cities: [
      'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
      'Alappuzha', 'Kannur', 'Kottayam', 'Manjeri', 'Thalassery', 'Ponnani', 'Vatakara',
      'Kanhangad', 'Payyanur'
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    cities: [
      'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna',
      'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind',
      'Chhindwara', 'Guna'
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    cities: [
      'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Navi Mumbai', 'Nashik', 'Chhatrapati Sambhajinagar',
      'Solapur', 'Kalyan-Dombivli', 'Vasai-Virar', 'Pimpri-Chinchwad', 'Kolhapur', 'Amravati',
      'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur',
      'Parbhani', 'Ichalkaranji', 'Jalna', 'Panvel', 'Satara'
    ],
  },
  {
    name: 'Manipur',
    code: 'MN',
    cities: ['Imphal', 'Churachandpur', 'Thoubal', 'Bishnupur', 'Ukhrul', 'Senapati', 'Kakching'],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    cities: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara'],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    cities: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai'],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon'],
  },
  {
    name: 'Odisha',
    code: 'OD',
    cities: [
      'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore',
      'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Jeypore', 'Angul'
    ],
  },
  {
    name: 'Punjab',
    code: 'PB',
    cities: [
      'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot',
      'Hoshiarpur', 'Batala', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara',
      'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Sangrur', 'Fazilka',
      'Mansa', 'Gurdaspur', 'Rupnagar', 'Fatehgarh Sahib', 'Nawanshahr', 'Zirakpur',
      'Derabassi', 'Nakodar', 'Jagraon', 'Tarn Taran', 'Sunam', 'Samana', 'Kotkapura',
      'Faridkot', 'Chandigarh'
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    cities: [
      'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar',
      'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Jhunjhunu', 'Hanumangarh', 'Beawar',
      'Kishangarh', 'Tonk', 'Sawai Madhopur'
    ],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    cities: ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Jorethang', 'Rangpo'],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    cities: [
      'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode',
      'Vellore', 'Tirunelveli', 'Thoothukudi', 'Nagercoil', 'Thanjavur', 'Dindigul',
      'Kanchipuram', 'Karur', 'Cuddalore', 'Kumbakonam', 'Hosur', 'Ambur'
    ],
  },
  {
    name: 'Telangana',
    code: 'TS',
    cities: [
      'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
      'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet'
    ],
  },
  {
    name: 'Tripura',
    code: 'TR',
    cities: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai'],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    cities: [
      'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj',
      'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida',
      'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur',
      'Farrukhabad', 'Mau', 'Hapur', 'Ayodhya', 'Etawah', 'Sambhal', 'Sultanpur'
    ],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    cities: [
      'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh',
      'Nainital', 'Almora', 'Pithoragarh', 'Mussoorie'
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    cities: [
      'Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda',
      'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat',
      'Haldia', 'Raiganj', 'Jalpaiguri', 'Balurghat'
    ],
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    cities: ['Port Blair', 'Car Nicobar', 'Diglipur', 'Mayabunder'],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    cities: ['Chandigarh'],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    cities: ['Daman', 'Diu', 'Silvassa'],
  },
  {
    name: 'Delhi NCR',
    code: 'DL',
    cities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Ghaziabad', 'Faridabad'],
  },
  {
    name: 'Jammu and Kashmir',
    code: 'JK',
    cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore', 'Rajouri', 'Punch'],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    cities: ['Leh', 'Kargil'],
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    cities: ['Kavaratti', 'Agatti', 'Amini', 'Andrott'],
  },
  {
    name: 'Puducherry',
    code: 'PY',
    cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  },
];

export const services27List = [
  {
    name: 'Cardiology & Heart Care',
    slug: 'cardiology',
    category: 'Cardiology & Heart Care',
    shortDescription: 'Interventional cardiology, open-heart surgery, pacemaker implantation, and cardiac emergency care.',
    description: 'Comprehensive cardiac unit providing state-of-the-art angioplasty, bypass surgery (CABG), valve replacement, pediatric cardiology, and 24/7 cardiac ICU emergency care.',
    seoTitle: 'Cardiology & Heart Care Hospitals in India - Clinic By Choice',
    seoDescription: 'Find top accredited heart hospitals, cardiologists, and cardiac surgeons in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Oncology & Cancer Care',
    slug: 'cancer-hospital',
    category: 'Oncology & Cancer Care',
    shortDescription: 'Medical oncology, surgical oncology, radiation therapy, and targeted immunotherapy.',
    description: 'Advanced cancer center with multidisciplinary tumor boards, chemotherapy suites, PET-CT diagnostics, radiation oncology, and specialized surgical oncology.',
    seoTitle: 'Oncology & Cancer Care Hospitals in India - Clinic By Choice',
    seoDescription: 'Top cancer hospitals, oncologists, and chemo specialists across India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Orthopedics & Joint Replacement',
    slug: 'orthopedics',
    category: 'Orthopedics & Musculoskeletal',
    shortDescription: 'Total knee & hip replacement, robotic joint surgery, arthroscopy, and fracture care.',
    description: 'Super-specialized orthopedic center for joint replacements, complex trauma repair, sports injuries, arthroscopic surgeries, and spine care.',
    seoTitle: 'Orthopedic & Joint Replacement Hospitals in India - Clinic By Choice',
    seoDescription: 'Leading joint replacement surgeons, knee surgery specialists, and orthopedic hospitals.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Neurology & Neurosurgery',
    slug: 'neurology',
    category: 'Neurosciences',
    shortDescription: 'Brain surgery, stroke management, epilepsy treatment, and spine surgery.',
    description: 'Dedicated institute for neurological care, brain tumor resections, stroke intervention, deep brain stimulation, and minimally invasive spine procedures.',
    seoTitle: 'Neurology & Neurosurgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Best neurologists, neurosurgeons, and spine specialists in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Gastroenterology & GI Surgery',
    slug: 'gastroenterology',
    category: 'Digestive Diseases',
    shortDescription: 'Advanced endoscopy, liver disease treatment, GI surgeries, and pancreatitis care.',
    description: 'Comprehensive gastroenterology unit featuring therapeutic endoscopy, ERCP, liver transplantation care, and laparoscopic digestive surgeries.',
    seoTitle: 'Gastroenterology & GI Surgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Top gastroenterologists, hepatologists, and GI surgeons in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Urology & Kidney Care',
    slug: 'urology',
    category: 'Urology & Renal Care',
    shortDescription: 'Laser kidney stone removal (RIRC/PCNL), prostate surgery (TURP/HoLEP), and urological oncology.',
    description: 'Advanced urology center offering minimally invasive laser stone treatments, reconstructive urology, prostate enlargement surgery, and pediatric urology.',
    seoTitle: 'Urology & Kidney Stone Hospitals in India - Clinic By Choice',
    seoDescription: 'Expert urologists and laser kidney stone surgeons in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Nephrology & Dialysis Care',
    slug: 'nephrology',
    category: 'Renal Care & Nephrology',
    shortDescription: 'Chronic kidney disease (CKD) management, hemodialysis, and kidney transplant care.',
    description: 'Round-the-clock hemodialysis unit, peritoneal dialysis services, and comprehensive care for acute kidney injury and end-stage renal disease.',
    seoTitle: 'Nephrology & Dialysis Centers in India - Clinic By Choice',
    seoDescription: 'Find kidney specialists, nephrologists, and accredited dialysis centers.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Plastic & Reconstructive Surgery',
    slug: 'plastic-surgery',
    category: 'Plastic & Reconstructive',
    shortDescription: 'Trauma reconstruction, burn care, scar revision, microvascular surgery, and cosmetic procedures.',
    description: 'Comprehensive plastic and reconstructive surgical unit providing specialized trauma repair, skin grafting, cleft lip repair, microvascular surgery, and aesthetic care.',
    seoTitle: 'Plastic & Reconstructive Surgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Leading plastic and reconstructive surgeons and cosmetic surgery centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Obstetrics & Gynecology',
    slug: 'gynecology',
    category: "Women's Health",
    shortDescription: 'High-risk pregnancy care, painless delivery, laparoscopic hysterectomy, and PCOD treatment.',
    description: 'Complete women’s health center offering maternity suites, fetal medicine, advanced gynecological laparoscopy, infertility evaluation, and menopause care.',
    seoTitle: 'Obstetrics & Gynecology Hospitals in India - Clinic By Choice',
    seoDescription: 'Top gynecologists, maternity hospitals, and women care specialists.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Pediatrics & Child Care',
    slug: 'pediatrics',
    category: 'Pediatric Care',
    shortDescription: 'Level III NICU, pediatric surgery, child growth monitoring, and routine vaccinations.',
    description: 'Dedicated mother and child super specialty care unit equipped with neonatal ICUs, pediatric emergency care, adolescent medicine, and pediatric surgeries.',
    seoTitle: 'Pediatrics & Child Care Hospitals in India - Clinic By Choice',
    seoDescription: 'Specialized child care hospitals, pediatricians, and NICU centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'ENT & Head Neck Surgery',
    slug: 'ent-surgery',
    category: 'Surgical Specialty',
    shortDescription: 'Sinus surgery, ear surgery, throat treatments, cochlear implants, and voice care.',
    description: 'Microscopic and endoscopic ENT surgical center offering endoscopic sinus surgery, tympanoplasty, vertigo management, and head & neck tumor resections.',
    seoTitle: 'ENT & Head Neck Surgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Leading ENT hospitals, sinus surgeons, and otolaryngologists in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Ophthalmology & Eye Care',
    slug: 'ophthalmology',
    category: 'Eye Care',
    shortDescription: 'Cataract surgery (Femto/Phaco), LASIK laser eye surgery, glaucoma treatment, and retina care.',
    description: 'Premier eye care hospital providing blade-free LASIK, micro-incision cataract surgery, corneal transplants, glaucoma care, and diabetic retinopathy procedures.',
    seoTitle: 'Ophthalmology & Eye Hospitals in India - Clinic By Choice',
    seoDescription: 'Find top eye specialists, LASIK laser surgeons, and cataract centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Dermatology & Cosmetology',
    slug: 'dermatology',
    category: 'Skin & Aesthetic Care',
    shortDescription: 'Acne treatment, laser hair removal, anti-aging therapies, psoriasis care, and hair transplants.',
    description: 'Comprehensive skin clinic offering clinical dermatology, dermatopathology, laser skin treatments, anti-aging procedures, and aesthetic cosmetic therapies.',
    seoTitle: 'Dermatology & Skin Care Clinics in India - Clinic By Choice',
    seoDescription: 'Top dermatologists, skin care specialists, and cosmetology clinics in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Pulmonology & Chest Medicine',
    slug: 'pulmonology',
    category: 'Respiratory Medicine',
    shortDescription: 'Asthma management, COPD care, bronchoscopy, sleep apnea evaluation, and chest infection care.',
    description: 'Specialized respiratory institute providing pulmonary function tests (PFT), sleep laboratory studies, interventional pulmonology, and critical respiratory care.',
    seoTitle: 'Pulmonology & Chest Hospitals in India - Clinic By Choice',
    seoDescription: 'Leading pulmonologists, chest specialists, and respiratory centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Endocrinology & Diabetes',
    slug: 'endocrinology',
    category: 'Endocrine & Metabolic Care',
    shortDescription: 'Diabetes mellitus management, thyroid disorders, hormonal imbalances, and obesity care.',
    description: 'Expert endocrine center providing specialized care for type 1 & 2 diabetes, thyroid disorders, osteoporosis, adrenal diseases, and growth hormones.',
    seoTitle: 'Endocrinology & Diabetes Clinics in India - Clinic By Choice',
    seoDescription: 'Best endocrinologists, diabetes specialists, and thyroid care centers.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Dental & Maxillofacial Surgery',
    slug: 'dental-care',
    category: 'Dental Sciences',
    shortDescription: 'Dental implants, root canal treatment, jaw realignment surgery, and cosmetic dentistry.',
    description: 'Full-spectrum dental suite offering painless root canals, dental implants, smile design, orthodontics, oral cancer screening, and jaw trauma repair.',
    seoTitle: 'Dental & Maxillofacial Hospitals in India - Clinic By Choice',
    seoDescription: 'Top dental surgeons, implantologists, and orthodontists in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Rheumatology & Autoimmune Care',
    slug: 'rheumatology',
    category: 'Autoimmune & Joint Care',
    shortDescription: 'Rheumatoid arthritis, lupus (SLE), gout, ankylosing spondylitis, and biologic therapies.',
    description: 'Specialized center for autoimmune rheumatic diseases, biologic targeted therapies, joint inflammation management, and connective tissue disorders.',
    seoTitle: 'Rheumatology & Autoimmune Clinics in India - Clinic By Choice',
    seoDescription: 'Leading rheumatologists and arthritis treatment centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Vascular & Endovascular Surgery',
    slug: 'vascular-surgery',
    category: 'Vascular Care',
    shortDescription: 'Varicose veins laser ablation, diabetic foot care, peripheral artery disease, and aneurysm repair.',
    description: 'Modern vascular center providing endovascular stenting, varicose vein laser ablation (EVLT), aortic aneurysm repair, and diabetic limb salvage surgery.',
    seoTitle: 'Vascular & Endovascular Hospitals in India - Clinic By Choice',
    seoDescription: 'Top vascular surgeons and laser varicose vein specialists in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'General & Laparoscopic Surgery',
    slug: 'general-surgery',
    category: 'General Surgery',
    shortDescription: 'Hernia repair, gallbladder removal, appendectomy, piles/fissure laser treatment, and trauma surgery.',
    description: 'Minimally invasive general surgical unit performing keyhole abdominal procedures, single-incision laparoscopic surgery, and laser proctology.',
    seoTitle: 'General & Laparoscopic Surgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Best general surgeons and laparoscopic specialists across India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Psychiatry & Behavioral Health',
    slug: 'psychiatry',
    category: 'Mental Health',
    shortDescription: 'Depression, anxiety treatment, addiction de-addiction, bipolar disorder, and counseling.',
    description: 'Compassionate behavioral health department offering psychiatric evaluation, psychotherapy, cognitive behavioral therapy (CBT), and de-addiction rehab.',
    seoTitle: 'Psychiatry & Behavioral Health Centers in India - Clinic By Choice',
    seoDescription: 'Top psychiatrists, clinical psychologists, and mental health centers.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Bariatric & Weight Loss Surgery',
    slug: 'bariatric-surgery',
    category: 'Bariatric & Metabolic Care',
    shortDescription: 'Sleeve gastrectomy, gastric bypass surgery, endoscopic intragastric balloon, and metabolic surgery.',
    description: 'Specialized bariatric surgical center helping patients achieve sustained weight loss, diabetes reversal, and resolution of metabolic syndrome.',
    seoTitle: 'Bariatric & Weight Loss Surgery Hospitals in India - Clinic By Choice',
    seoDescription: 'Leading bariatric surgeons and weight loss centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'IVF & Reproductive Medicine',
    slug: 'ivf-fertility',
    category: 'Fertility & Reproductive Care',
    shortDescription: 'IVF, IUI, ICSI, egg freezing, male infertility care, and genetic embryo testing (PGT).',
    description: 'High-success fertility clinic equipped with advanced embryology labs, ICSI equipment, blastocyst culture, and comprehensive male/female fertility solutions.',
    seoTitle: 'IVF & Fertility Centers in India - Clinic By Choice',
    seoDescription: 'Top IVF doctors, fertility specialists, and accredited reproductive labs.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Hematology & Bone Marrow Transplant',
    slug: 'hematology',
    category: 'Blood & Bone Marrow Care',
    shortDescription: 'Leukemia treatment, aplastic anemia, thalassemia, lymphoma care, and bone marrow transplants.',
    description: 'Comprehensive hematology & BMT center specializing in blood disorders, autologous and allogeneic bone marrow transplantation, and CAR-T cell therapy.',
    seoTitle: 'Hematology & Bone Marrow Transplant Hospitals in India - Clinic By Choice',
    seoDescription: 'Expert hematologists and bone marrow transplant centers in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Organ Transplantation',
    slug: 'organ-transplant',
    category: 'Transplant Sciences',
    shortDescription: 'Kidney transplant, liver transplant, heart transplant, and specialized post-transplant ICU care.',
    description: 'State-of-the-art organ transplant institute with sterile isolation ICUs, multi-organ transplant surgeons, and advanced immunosuppression management.',
    seoTitle: 'Organ Transplantation Hospitals in India - Clinic By Choice',
    seoDescription: 'Top kidney, liver, and heart transplant hospitals and surgeons in India.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Emergency & Critical Care Medicine',
    slug: 'critical-care',
    category: 'Emergency & ICU',
    shortDescription: '24/7 trauma emergency, mechanical ventilation, sepsis management, and multi-organ care.',
    description: 'Fully equipped intensive care unit (ICU, CCU, HDU) staffed 24/7 by experienced intensivists, trauma specialists, and emergency physicians.',
    seoTitle: '24/7 Emergency & Critical Care Hospitals in India - Clinic By Choice',
    seoDescription: 'Find accredited emergency care hospitals and ICUs with 24/7 trauma response.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Physiotherapy & Rehabilitation',
    slug: 'physiotherapy',
    category: 'Rehabilitation Sciences',
    shortDescription: 'Post-stroke rehab, spinal cord rehab, sports injury therapy, and chronic pain management.',
    description: 'Advanced physical therapy and rehabilitation center providing robotic rehab, dry needling, electrotherapy, stroke recovery, and ergonomic rehabilitation.',
    seoTitle: 'Physiotherapy & Rehabilitation Centers in India - Clinic By Choice',
    seoDescription: 'Top physiotherapists, neuro-rehab specialists, and physical recovery clinics.',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Pathology & Advanced Diagnostics',
    slug: 'pathology-diagnostics',
    category: 'Diagnostics & Imaging',
    shortDescription: '1.5T/3T MRI, 128-slice CT scan, digital mammography, molecular diagnostics, and blood testing.',
    description: 'Comprehensive diagnostic hub delivering fast, reliable clinical pathology, high-resolution radiology imaging, PET-CT scans, and preventative health checks.',
    seoTitle: 'Pathology & Diagnostic Centers in India - Clinic By Choice',
    seoDescription: 'Accredited diagnostic labs, MRI/CT scan centers, and health test packages in India.',
    status: 'ACTIVE' as const,
  },
];

export async function seedIndiaStatesCitiesAndServices() {
  const { connectDB } = await import('../lib/db');
  const { State, City, Service } = await import('../models');

  console.log(' Connecting to database...');
  await connectDB();

  console.log(' Syncing State, City, and Service tables...');
  await State.sync({ alter: true });
  await City.sync({ alter: true });
  await Service.sync({ alter: true });

  console.log(` Starting seeding for ${indianStatesAndCities.length} Indian States & Union Territories...`);
  let stateCount = 0;
  let cityCount = 0;

  for (const stateData of indianStatesAndCities) {
    let [stateObj] = await State.findOrCreate({
      where: { name: stateData.name },
      defaults: {
        name: stateData.name,
        code: stateData.code,
        status: 'ACTIVE',
      },
    });

    if (stateData.code && (!stateObj.code || stateObj.code !== stateData.code)) {
      await stateObj.update({ code: stateData.code });
    }
    stateCount++;

    for (const cityName of stateData.cities) {
      const [cityObj, created] = await City.findOrCreate({
        where: { stateId: stateObj.id, name: cityName },
        defaults: {
          stateId: stateObj.id,
          name: cityName,
          isPopular: true,
          status: 'ACTIVE',
        },
      });
      if (created) {
        cityCount++;
      }
    }
  }

  console.log(` Successfully processed ${stateCount} States/UTs and ${cityCount} new Cities!`);

  console.log(` Starting seeding for ${services27List.length} Medical Services/Specialties...`);
  let serviceCount = 0;

  for (const s of services27List) {
    const existing = await Service.findOne({ where: { slug: s.slug } });
    if (!existing) {
      await Service.create(s);
      serviceCount++;
    } else {
      await existing.update(s);
    }
  }

  console.log(` Successfully seeded/updated ${services27List.length} Medical Services! (${serviceCount} new added)`);
}

async function main() {
  try {
    console.log('----------------------------------------------------');
    console.log(' Clinic By Choice - Indian States, Cities & Services Seeder');
    console.log('----------------------------------------------------');
    console.log('• MYSQL_HOST:', process.env.MYSQL_HOST || '127.0.0.1');
    console.log('• MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('• MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'clinicbychoice');
    console.log('----------------------------------------------------');

    await seedIndiaStatesCitiesAndServices();

    console.log(' Complete! All States, Cities & 27 Services added successfully to the database.');
    process.exit(0);
  } catch (error) {
    console.error(' Seeder script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
