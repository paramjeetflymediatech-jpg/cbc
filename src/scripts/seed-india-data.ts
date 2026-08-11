import dotenv from 'dotenv';
import path from 'path';

// Environment variables are loaded first before dynamically importing DB & Models
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const indianStatesDistrictsCitiesData = [
  {
    name: 'Punjab',
    code: 'PB',
    districts: [
      { name: 'Ludhiana', cities: ['Ludhiana City', 'Khanna', 'Jagraon', 'Samrala', 'Raikot', 'Doraha', 'Payal'] },
      { name: 'Amritsar', cities: ['Amritsar City', 'Majitha', 'Jandiala Guru', 'Baba Bakala', 'Ajnala', 'Ramdass'] },
      { name: 'Jalandhar', cities: ['Jalandhar City', 'Nakodar', 'Phillaur', 'Shahkot', 'Goraya', 'Kartarpur', 'Adampur'] },
      { name: 'SAS Nagar (Mohali)', cities: ['Mohali (SAS Nagar)', 'Zirakpur', 'Derabassi', 'Kharar', 'Kurali'] },
      { name: 'Patiala', cities: ['Patiala City', 'Rajpura', 'Samana', 'Nabha', 'Patran'] },
      { name: 'Bathinda', cities: ['Bathinda City', 'Maur', 'Rampura Phul', 'Talwandi Sabo', 'Goniana'] },
      { name: 'Hoshiarpur', cities: ['Hoshiarpur City', 'Dasuya', 'Mukerian', 'Garhshankar', 'Tanda'] },
      { name: 'Gurdaspur', cities: ['Gurdaspur City', 'Batala', 'Dera Baba Nanak', 'Dinanagar', 'Qadian'] },
      { name: 'Pathankot', cities: ['Pathankot City', 'Sujanpur', 'Dhar Kalan'] },
      { name: 'Moga', cities: ['Moga City', 'Baghapurana', 'Nihal Singh Wala', 'Dharamkot'] },
      { name: 'Faridkot', cities: ['Faridkot City', 'Kotkapura', 'Jaitu'] },
      { name: 'Sri Muktsar Sahib', cities: ['Muktsar', 'Malout', 'Gidderbaha'] },
      { name: 'Fazilka', cities: ['Fazilka City', 'Abohar', 'Jalalabad'] },
      { name: 'Firozpur', cities: ['Firozpur City', 'Zira', 'Guru Har Sahai'] },
      { name: 'Kapurthala', cities: ['Kapurthala City', 'Phagwara', 'Sultanpur Lodhi', 'Bholath'] },
      { name: 'Sangrur', cities: ['Sangrur City', 'Sunam', 'Dhuri', 'Dirba', 'Moonak'] },
      { name: 'Malerkotla', cities: ['Malerkotla City', 'Ahmedgarh', 'Amargarh'] },
      { name: 'Barnala', cities: ['Barnala City', 'Tapa', 'Bhadaur'] },
      { name: 'Mansa', cities: ['Mansa City', 'Budhlada', 'Sardulgarh'] },
      { name: 'Rupnagar (Ropar)', cities: ['Rupnagar (Ropar)', 'Anandpur Sahib', 'Chamkaur Sahib', 'Nangal'] },
      { name: 'Fatehgarh Sahib', cities: ['Sirhind-Fatehgarh Sahib', 'Mandi Gobindgarh', 'Amloh', 'Bassi Pathana'] },
      { name: 'Shaheed Bhagat Singh Nagar', cities: ['Nawanshahr', 'Banga', 'Balachaur'] },
      { name: 'Tarn Taran', cities: ['Tarn Taran Sahib', 'Patti', 'Khadoor Sahib', 'Bhikhiwind'] },
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    districts: [
      { name: 'Mumbai City', cities: ['Mumbai', 'Colaba', 'Dadar', 'Fort', 'Malabar Hill'] },
      { name: 'Mumbai Suburban', cities: ['Andheri', 'Borivali', 'Kurla', 'Ghatkopar', 'Malad', 'Juhu', 'Powai', 'Goregaon', 'Chembur'] },
      { name: 'Thane', cities: ['Thane City', 'Kalyan', 'Dombivli', 'Mira-Bhayandar', 'Bhiwandi', 'Ulhasnagar', 'Badlapur', 'Ambernath'] },
      { name: 'Palghar', cities: ['Vasai', 'Virar', 'Palghar', 'Dahanu', 'Nalasopara'] },
      { name: 'Raigad', cities: ['Navi Mumbai (South)', 'Panvel', 'Alibag', 'Karjat', 'Khopoli', 'Mahad', 'Roha'] },
      { name: 'Pune', cities: ['Pune City', 'Pimpri-Chinchwad', 'Baramati', 'Lonavala', 'Talegaon Dabhade', 'Daund', 'Shirur', 'Chakan'] },
      { name: 'Nagpur', cities: ['Nagpur City', 'Kamptee', 'Umred', 'Ramtek', 'Katol'] },
      { name: 'Nashik', cities: ['Nashik City', 'Malegaon', 'Sinnar', 'Deolali', 'Igatpuri', 'Niphad'] },
      { name: 'Chhatrapati Sambhajinagar', cities: ['Chhatrapati Sambhajinagar', 'Paithan', 'Sillod', 'Gangapur', 'Vaijapur'] },
      { name: 'Kolhapur', cities: ['Kolhapur City', 'Ichalkaranji', 'Kagal', 'Jaysingpur', 'Gadhinglaj'] },
      { name: 'Solapur', cities: ['Solapur City', 'Pandharpur', 'Barshi', 'Sangole', 'Akkalkot'] },
      { name: 'Amravati', cities: ['Amravati City', 'Achalpur', 'Anjangaon', 'Warud'] },
      { name: 'Nanded', cities: ['Nanded City', 'Degloor', 'Kinwat', 'Mukhed'] },
      { name: 'Sangli', cities: ['Sangli City', 'Miraj', 'Vita', 'Islampur', 'Tasgaon'] },
      { name: 'Jalgaon', cities: ['Jalgaon City', 'Bhusawal', 'Chalisgaon', 'Amalner'] },
      { name: 'Akola', cities: ['Akola City', 'Akot', 'Murtizapur'] },
      { name: 'Latur', cities: ['Latur City', 'Udgir', 'Ahmedpur'] },
      { name: 'Dhule', cities: ['Dhule City', 'Shirpur', 'Dondaicha'] },
      { name: 'Ahilyanagar', cities: ['Ahilyanagar (Ahmednagar)', 'Shirdi', 'Sangamner', 'Kopargaon', 'Rahuri', 'Shrigonda'] },
      { name: 'Satara', cities: ['Satara City', 'Karad', 'Mahabaleshwar', 'Wai', 'Phaltan'] },
    ],
  },
  {
    name: 'Delhi NCR',
    code: 'DL',
    districts: [
      { name: 'Central Delhi', cities: ['Connaught Place', 'Karol Bagh', 'Paharganj', 'Daryaganj'] },
      { name: 'New Delhi', cities: ['Chanakyapuri', 'Vasant Vihar', 'RK Puram'] },
      { name: 'South Delhi', cities: ['Saket', 'Hauz Khas', 'Greater Kailash', 'Lajpat Nagar', 'Defence Colony'] },
      { name: 'South West Delhi', cities: ['Dwarka', 'Vasant Kunj', 'Janakpuri'] },
      { name: 'West Delhi', cities: ['Rajouri Garden', 'Punjabi Bagh', 'Tilak Nagar', 'Patel Nagar'] },
      { name: 'North West Delhi', cities: ['Rohini', 'Pitampura', 'Shalimar Bagh', 'Model Town'] },
      { name: 'North Delhi', cities: ['Civil Lines', 'Sadar Bazar', 'Chandni Chowk'] },
      { name: 'East Delhi', cities: ['Mayur Vihar', 'Laxmi Nagar', 'Preet Vihar', 'Anand Vihar'] },
      { name: 'North East Delhi', cities: ['Shahdara', 'Seelampur', 'Dilshad Garden'] },
      { name: 'Gurugram', cities: ['Gurgaon City', 'DLF Cyber City', 'Sohna', 'Manesar'] },
      { name: 'Gautam Buddha Nagar', cities: ['Noida', 'Greater Noida', 'Dadri'] },
      { name: 'Ghaziabad', cities: ['Ghaziabad City', 'Indirapuram', 'Vaishali', 'Vasundhara', 'Sahibabad', 'Loni'] },
      { name: 'Faridabad', cities: ['Faridabad City', 'Ballabhgarh', 'NIT Faridabad'] },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    districts: [
      { name: 'Bengaluru Urban', cities: ['Bengaluru (Bangalore)', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City', 'Jayanagar', 'Malleshwaram', 'Yelahanka'] },
      { name: 'Mysuru', cities: ['Mysuru (Mysore)', 'Nanjangud', 'Hunsur'] },
      { name: 'Dharwad', cities: ['Hubballi', 'Dharwad'] },
      { name: 'Dakshina Kannada', cities: ['Mangaluru (Mangalore)', 'Puttur', 'Bantwal'] },
      { name: 'Belagavi', cities: ['Belagavi (Belgaum)', 'Gokak', 'Chikkodi'] },
      { name: 'Davanagere', cities: ['Davanagere', 'Harihar'] },
      { name: 'Ballari', cities: ['Ballari (Bellary)', 'Hospet (Vijayanagara)'] },
      { name: 'Kalaburagi', cities: ['Kalaburagi (Gulbarga)', 'Sedam'] },
      { name: 'Shivamogga', cities: ['Shivamogga (Shimoga)', 'Bhadravati'] },
      { name: 'Tumakuru', cities: ['Tumakuru (Tumkur)', 'Tiptur'] },
      { name: 'Udupi', cities: ['Udupi', 'Manipal', 'Kundapura'] },
    ],
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    districts: [
      { name: 'Chennai', cities: ['Chennai', 'T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Mylapore', 'Tambaram', 'Chromepet'] },
      { name: 'Coimbatore', cities: ['Coimbatore', 'Pollachi', 'Mettupalayam'] },
      { name: 'Madurai', cities: ['Madurai', 'Melur', 'Thirumangalam'] },
      { name: 'Tiruchirappalli', cities: ['Tiruchirappalli (Trichy)', 'Srirangam', 'Manapparai'] },
      { name: 'Salem', cities: ['Salem', 'Mettur', 'Attur'] },
      { name: 'Tiruppur', cities: ['Tiruppur', 'Avinashi', 'Udumalaipettai'] },
      { name: 'Erode', cities: ['Erode', 'Gobichettipalayam', 'Perundurai'] },
      { name: 'Vellore', cities: ['Vellore', 'Katpadi', 'Gudiyatham'] },
      { name: 'Tirunelveli', cities: ['Tirunelveli', 'Ambasamudram'] },
    ],
  },
  {
    name: 'Telangana',
    code: 'TS',
    districts: [
      { name: 'Hyderabad', cities: ['Hyderabad', 'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'HITECH City', 'Madhapur', 'Secunderabad', 'Begumpet'] },
      { name: 'Medchal-Malkajgiri', cities: ['Malkajgiri', 'Uppal', 'Quthbullapur', 'Kukatpally', 'Medchal'] },
      { name: 'Rangareddy', cities: ['LB Nagar', 'Rajendranagar', 'Serilingampally', 'Shamshabad'] },
      { name: 'Hanamkonda', cities: ['Warangal', 'Hanamkonda', 'Kazipet'] },
      { name: 'Nizamabad', cities: ['Nizamabad', 'Bodhan', 'Armoor'] },
      { name: 'Khammam', cities: ['Khammam', 'Sathupally'] },
      { name: 'Karimnagar', cities: ['Karimnagar', 'Huzurabad'] },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    districts: [
      { name: 'Ahmedabad', cities: ['Ahmedabad City', 'SG Highway', 'Satellite', 'Bodakdev', 'Maninagar', 'Sanand'] },
      { name: 'Surat', cities: ['Surat City', 'Varachha', 'Adajan', 'Rander', 'Bardoli'] },
      { name: 'Vadodara', cities: ['Vadodara (Baroda)', 'Alkapuri', 'Gotri', 'Dabhoi'] },
      { name: 'Rajkot', cities: ['Rajkot City', 'Gondal', 'Jetpur'] },
      { name: 'Bhavnagar', cities: ['Bhavnagar', 'Palitana'] },
      { name: 'Jamnagar', cities: ['Jamnagar', 'Dwarka'] },
      { name: 'Gandhinagar', cities: ['Gandhinagar', 'Kalol'] },
    ],
  },
  {
    name: 'Kerala',
    code: 'KL',
    districts: [
      { name: 'Ernakulam', cities: ['Kochi (Cochin)', 'Ernakulam', 'Aluva', 'Angamaly', 'Perumbavoor', 'Muvattupuzha'] },
      { name: 'Thiruvananthapuram', cities: ['Thiruvananthapuram (Trivandrum)', 'Neyyattinkara', 'Attingal', 'Varkala'] },
      { name: 'Kozhikode', cities: ['Kozhikode (Calicut)', 'Vatakara', 'Koyilandy'] },
      { name: 'Thrissur', cities: ['Thrissur', 'Chalakudy', 'Kodungallur', 'Guruvayur'] },
      { name: 'Kollam', cities: ['Kollam (Quilon)', 'Punalur', 'Karunagappalli'] },
      { name: 'Palakkad', cities: ['Palakkad', 'Ottapalam', 'Shornur'] },
      { name: 'Kannur', cities: ['Kannur', 'Thalassery', 'Payyanur'] },
    ],
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    districts: [
      { name: 'Lucknow', cities: ['Lucknow', 'Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar'] },
      { name: 'Kanpur Nagar', cities: ['Kanpur', 'Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar'] },
      { name: 'Varanasi', cities: ['Varanasi', 'Lanka', 'Sigra', 'Shivpur'] },
      { name: 'Agra', cities: ['Agra', 'Tajganj', 'Sanjay Place'] },
      { name: 'Prayagraj', cities: ['Prayagraj (Allahabad)', 'Civil Lines', 'Katra', 'Naini'] },
      { name: 'Meerut', cities: ['Meerut', 'Shastri Nagar', 'Mawana'] },
      { name: 'Gorakhpur', cities: ['Gorakhpur', 'Golghar', 'Shahpur'] },
      { name: 'Bareilly', cities: ['Bareilly', 'Civil Lines', 'Izatnagar'] },
    ],
  },
  {
    name: 'West Bengal',
    code: 'WB',
    districts: [
      { name: 'Kolkata', cities: ['Kolkata', 'Park Street', 'Salt Lake', 'New Town', 'Bhowanipore', 'Alipore'] },
      { name: 'Howrah', cities: ['Howrah', 'Bally', 'Uluberia'] },
      { name: 'North 24 Parganas', cities: ['Rajarhat', 'Dum Dum', 'Barasat', 'Barrackpore'] },
      { name: 'Paschim Bardhaman', cities: ['Asansol', 'Durgapur'] },
      { name: 'Darjeeling', cities: ['Siliguri', 'Darjeeling', 'Kurseong'] },
    ],
  },
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      { name: 'Visakhapatnam', cities: ['Visakhapatnam', 'Gajuwaka', 'Anakapalle'] },
      { name: 'NTR (Vijayawada)', cities: ['Vijayawada', 'Jaggaiahpeta'] },
      { name: 'Guntur', cities: ['Guntur', 'Tenali', 'Narasaraopet'] },
      { name: 'Tirupati', cities: ['Tirupati', 'Srikalahasti'] },
    ],
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    districts: [
      { name: 'Papum Pare', cities: ['Itanagar', 'Naharlagun'] },
      { name: 'East Siang', cities: ['Pasighat'] },
    ],
  },
  {
    name: 'Assam',
    code: 'AS',
    districts: [
      { name: 'Kamrup Metropolitan', cities: ['Guwahati', 'Dispur'] },
      { name: 'Cachar', cities: ['Silchar'] },
      { name: 'Dibrugarh', cities: ['Dibrugarh', 'Tinsukia'] },
    ],
  },
  {
    name: 'Bihar',
    code: 'BR',
    districts: [
      { name: 'Patna', cities: ['Patna', 'Danapur', 'Patna Sahib'] },
      { name: 'Gaya', cities: ['Gaya', 'Bodh Gaya'] },
      { name: 'Bhagalpur', cities: ['Bhagalpur'] },
      { name: 'Muzaffarpur', cities: ['Muzaffarpur'] },
    ],
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    districts: [
      { name: 'Raipur', cities: ['Raipur', 'Naya Raipur'] },
      { name: 'Durg', cities: ['Bhilai', 'Durg'] },
      { name: 'Bilaspur', cities: ['Bilaspur'] },
    ],
  },
  {
    name: 'Goa',
    code: 'GA',
    districts: [
      { name: 'North Goa', cities: ['Panaji', 'Mapusa', 'Bicholim'] },
      { name: 'South Goa', cities: ['Margao', 'Vasco da Gama', 'Ponda'] },
    ],
  },
  {
    name: 'Haryana',
    code: 'HR',
    districts: [
      { name: 'Gurugram', cities: ['Gurgaon', 'Manesar', 'Sohna'] },
      { name: 'Faridabad', cities: ['Faridabad', 'Ballabhgarh'] },
      { name: 'Ambala', cities: ['Ambala City', 'Ambala Cantt'] },
      { name: 'Panipat', cities: ['Panipat'] },
      { name: 'Karnal', cities: ['Karnal'] },
      { name: 'Rohtak', cities: ['Rohtak'] },
      { name: 'Panchkula', cities: ['Panchkula'] },
    ],
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    districts: [
      { name: 'Shimla', cities: ['Shimla'] },
      { name: 'Kangra', cities: ['Dharamshala', 'Palampur'] },
      { name: 'Solan', cities: ['Solan', 'Baddi'] },
    ],
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    districts: [
      { name: 'Ranchi', cities: ['Ranchi'] },
      { name: 'East Singhbhum', cities: ['Jamshedpur'] },
      { name: 'Dhanbad', cities: ['Dhanbad'] },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    districts: [
      { name: 'Indore', cities: ['Indore'] },
      { name: 'Bhopal', cities: ['Bhopal'] },
      { name: 'Jabalpur', cities: ['Jabalpur'] },
      { name: 'Gwalior', cities: ['Gwalior'] },
      { name: 'Ujjain', cities: ['Ujjain'] },
    ],
  },
  {
    name: 'Manipur',
    code: 'MN',
    districts: [{ name: 'Imphal East', cities: ['Imphal'] }],
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    districts: [{ name: 'East Khasi Hills', cities: ['Shillong'] }],
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    districts: [{ name: 'Aizawl', cities: ['Aizawl'] }],
  },
  {
    name: 'Nagaland',
    code: 'NL',
    districts: [
      { name: 'Kohima', cities: ['Kohima'] },
      { name: 'Dimapur', cities: ['Dimapur'] },
    ],
  },
  {
    name: 'Odisha',
    code: 'OD',
    districts: [
      { name: 'Khurda', cities: ['Bhubaneswar'] },
      { name: 'Cuttack', cities: ['Cuttack'] },
      { name: 'Sundargarh', cities: ['Rourkela'] },
    ],
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    districts: [
      { name: 'Jaipur', cities: ['Jaipur'] },
      { name: 'Jodhpur', cities: ['Jodhpur'] },
      { name: 'Kota', cities: ['Kota'] },
      { name: 'Udaipur', cities: ['Udaipur'] },
    ],
  },
  {
    name: 'Sikkim',
    code: 'SK',
    districts: [{ name: 'Gangtok', cities: ['Gangtok'] }],
  },
  {
    name: 'Tripura',
    code: 'TR',
    districts: [{ name: 'West Tripura', cities: ['Agartala'] }],
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    districts: [
      { name: 'Dehradun', cities: ['Dehradun', 'Rishikesh', 'Mussoorie'] },
      { name: 'Haridwar', cities: ['Haridwar', 'Roorkee'] },
      { name: 'Nainital', cities: ['Haldwani', 'Nainital'] },
    ],
  },
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    districts: [{ name: 'South Andaman', cities: ['Port Blair'] }],
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    districts: [{ name: 'Chandigarh', cities: ['Chandigarh'] }],
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DN',
    districts: [
      { name: 'Daman', cities: ['Daman'] },
      { name: 'Diu', cities: ['Diu'] },
      { name: 'Silvassa', cities: ['Silvassa'] },
    ],
  },
  {
    name: 'Jammu and Kashmir',
    code: 'JK',
    districts: [
      { name: 'Srinagar', cities: ['Srinagar'] },
      { name: 'Jammu', cities: ['Jammu'] },
    ],
  },
  {
    name: 'Ladakh',
    code: 'LA',
    districts: [{ name: 'Leh', cities: ['Leh', 'Kargil'] }],
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    districts: [{ name: 'Lakshadweep', cities: ['Kavaratti'] }],
  },
  {
    name: 'Puducherry',
    code: 'PY',
    districts: [{ name: 'Puducherry', cities: ['Puducherry', 'Karaikal', 'Mahe'] }],
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
  const { State, District, City, Service } = await import('../models');

  console.log(' Connecting to database...');
  await connectDB();

  console.log(' Syncing State, District, City, and Service tables...');
  await State.sync({ alter: true });
  await District.sync({ alter: true });
  await City.sync({ alter: true });
  await Service.sync({ alter: true });

  console.log(` Starting seeding for ${indianStatesDistrictsCitiesData.length} Indian States & Union Territories...`);
  let stateCount = 0;
  let distCount = 0;
  let cityCount = 0;

  for (const stateData of indianStatesDistrictsCitiesData) {
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

    for (const distData of stateData.districts) {
      let [districtObj, distCreated] = await District.findOrCreate({
        where: { stateId: stateObj.id, name: distData.name },
        defaults: {
          stateId: stateObj.id,
          name: distData.name,
          status: 'ACTIVE',
        },
      });
      if (distCreated) distCount++;

      for (const cityName of distData.cities) {
        const [cityObj, cityCreated] = await City.findOrCreate({
          where: { stateId: stateObj.id, name: cityName },
          defaults: {
            stateId: stateObj.id,
            districtId: districtObj.id,
            name: cityName,
            isPopular: true,
            status: 'ACTIVE',
          },
        });
        if (cityObj.districtId !== districtObj.id) {
          await cityObj.update({ districtId: districtObj.id });
        }
        if (cityCreated) cityCount++;
      }
    }
  }

  console.log(` Successfully processed ${stateCount} States, ${distCount} Districts, and ${cityCount} Cities!`);

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
    console.log(' Clinic By Choice - Indian States, Districts, Cities & Services Seeder');
    console.log('----------------------------------------------------');
    console.log('• MYSQL_HOST:', process.env.MYSQL_HOST || '127.0.0.1');
    console.log('• MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('• MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'clinicbychoice');
    console.log('----------------------------------------------------');

    await seedIndiaStatesCitiesAndServices();

    console.log(' Complete! All States, Districts, Cities & 27 Services added successfully.');
    process.exit(0);
  } catch (error) {
    console.error(' Seeder script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
