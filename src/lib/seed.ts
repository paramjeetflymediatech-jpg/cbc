import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });



export async function seedDatabase() {
  const { connectDB } = await import('./db');
  const { User, Hospital, Service, HospitalService, LeadPackage, State, City, BlogPost } = await import('@/models');
  const { hashPassword } = await import('./auth');

  await connectDB();

  // Force sync State & City tables first
  await State.sync();
  await City.sync();

  console.log('Seeding Clinic By Choice database with Union Super Speciality Hospital...');

  // Seed all 36 Indian States/UTs with Cities and 27 Medical Services
  const { seedIndiaStatesCitiesAndServices } = await import('../scripts/seed-india-data');
  await seedIndiaStatesCitiesAndServices();

  // 3. Seed Super Admin User
  const adminEmail = 'admin@clinicbychoice.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passHash = await hashPassword('Admin123!');
    await User.create({
      name: 'Clinic By Choice Admin',
      email: adminEmail,
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
  }

  // 4. Seed Union Super Speciality Hospital
  const unionHospitalData = {
    slug: 'unionsuperspecialityhospital',
    name: 'Union Super Speciality Hospital',
    email: 'info@unionsuperspecialityhospital.com',
    phone: '+91 9876543210',
    website: 'https://unionsuperspecialityhospital.com',
    address: 'Basant Avenue, Duggri, Urban Estate, near BCM School',
    city: 'Ludhiana',
    state: 'Punjab',
    country: 'India',
    description: 'Union Super Speciality Hospital is a premier multi-specialty healthcare institute located in Ludhiana, Punjab. Equipped with state-of-the-art operation theaters, 24/7 ICU & trauma emergency, advanced diagnostic imaging, and highly experienced consultants across Plastic Surgery, Cancer Care, Laparoscopy, Urology, ENT, and Pediatrics.',
    logo: 'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/logocbc.png',
    coverImage: 'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/2902-1024x683.jpg',
    servicesToLink: [
      { slug: 'cancer-hospital', subServices: 'Breast Cancer Care & Surgery, Head & Neck Cancer, Lung Cancer, Cervical Oncology, Prostate Cancer' },
      { slug: 'orthopedics', subServices: 'Knee Replacement Surgery, Hip Replacement Surgery, Spine Surgery, Arthroscopy' },
      { slug: 'plastic-surgery', subServices: 'Reconstructive Surgery, Rhinoplasty, Burn Care, Scar Revision' },
      { slug: 'gastroenterology', subServices: 'Laparoscopic Surgery, Endoscopy, Liver & Gallbladder Surgery' },
      { slug: 'urology', subServices: 'Laser Kidney Stone Removal, Prostate Surgery (TURP), Reconstructive Urology' },
      { slug: 'ent-surgery', subServices: 'Sinus Surgery, Tympanoplasty, Head & Neck Surgery' },
      { slug: 'pediatrics', subServices: 'Neonatal ICU, Pediatric Surgery, Vaccination Clinic' },
    ],
  };

  const seedDoctorsList = [
    {
      name: 'Dr. S. S. Gill',
      qualification: 'MS, MCh (Plastic Surgery)',
      specialty: 'Chief Consultant Plastic & Reconstructive Surgeon',
      experience: '20+ Years',
      treatments: ['Plastic Surgery', 'Rhinoplasty', 'Reconstructive Surgery', 'Burn Care'],
    },
    {
      name: 'Dr. Harpreet Singh',
      qualification: 'MS, DNB (Surgical Oncology)',
      specialty: 'Senior Consultant Surgical Oncologist',
      experience: '16 Years',
      treatments: ['Tumor Resection', 'Cancer Surgery', 'Chemotherapy Planning'],
    },
    {
      name: 'Dr. Amanpreet Kaur',
      qualification: 'MD, DNB (Pediatrics)',
      specialty: 'Consultant Pediatrician & Neonatologist',
      experience: '14 Years',
      treatments: ['Pediatric Care', 'Neonatal Intensive Care', 'Childhood Vaccinations'],
    },
  ];

  let unionHospital = await Hospital.findOne({ where: { slug: unionHospitalData.slug } });
  if (!unionHospital) {
    unionHospital = await Hospital.create({
      name: unionHospitalData.name,
      slug: unionHospitalData.slug,
      email: unionHospitalData.email,
      phone: unionHospitalData.phone,
      website: unionHospitalData.website,
      address: unionHospitalData.address,
      city: unionHospitalData.city,
      state: unionHospitalData.state,
      country: unionHospitalData.country,
      description: unionHospitalData.description,
      logo: unionHospitalData.logo,
      coverImage: unionHospitalData.coverImage,
      contactPersonName: 'Medical Director',
      contactPersonEmail: unionHospitalData.email,
      contactPersonPhone: unionHospitalData.phone,
      status: 'APPROVED',
      accountStatus: 'ACTIVE',
      leadsRemaining: 50,
      totalLeadsPurchased: 50,
      totalLeadsUsed: 0,
      doctors: seedDoctorsList,
      facilities: ['24/7 Trauma ICU & Emergency', 'Modular OTs & Cath Lab', 'Laser Urology & Laparoscopy Suite', 'In-house Pharmacy & 1.5T MRI Diagnostics', 'Dedicated Patient Coordinator Desk'],
      faqs: [
        {
          question: 'Where is Union Super Speciality Hospital located?',
          answer: 'The hospital is conveniently located at Basant Avenue, Duggri, Urban Estate, near BCM School, Ludhiana, Punjab.',
        },
        {
          question: 'How do I book a consultation with a specialist doctor?',
          answer: 'You can submit your enquiry directly via the Instant Patient Enquiry form on this page or call our help desk.',
        },
        {
          question: 'Does the hospital provide emergency care?',
          answer: 'Yes, Union Super Speciality Hospital operates a 24/7 Trauma ICU, Emergency Department, and Ambulance service.',
        },
      ],
      rating: 4.9,
      isFeatured: true,
      isNabhAccredited: true,
      isVerifiedPartner: true,
    });

    const userPassHash = await hashPassword('Union123!');
    await User.create({
      name: 'Union Super Speciality Hospital Admin',
      email: unionHospitalData.email,
      passwordHash: userPassHash,
      role: 'HOSPITAL',
      hospitalId: unionHospital.id,
      phone: unionHospitalData.phone,
      status: 'ACTIVE',
    });
  } else {
    // Update doctors in existing seeded hospital if treatments missing
    const existingDoctors = unionHospital.doctors || [];
    const hasTreatments = existingDoctors.some((d) => d.treatments && d.treatments.length > 0);
    if (!hasTreatments) {
      await unionHospital.update({ doctors: seedDoctorsList });
    }
  }

  // Link services with comma-separated sub-services
  for (const item of unionHospitalData.servicesToLink) {
    const svcObj = await Service.findOne({ where: { slug: item.slug } });
    if (svcObj) {
      const [hs, created] = await HospitalService.findOrCreate({
        where: { hospitalId: unionHospital.id, serviceId: svcObj.id },
        defaults: {
          hospitalId: unionHospital.id,
          serviceId: svcObj.id,
          startingPrice: 35000.0,
          description: `Specialized clinical care & procedure for ${svcObj.name}.`,
          treatmentDetails: 'Comprehensive pre-operative evaluation, expert surgical procedure, and post-operative rehabilitation.',
          subServices: item.subServices,
          status: 'ACTIVE',
        },
      });
      if (!created && item.subServices) {
        await hs.update({ subServices: item.subServices });
      }
    }
  }

  // Seed Blog Posts if empty
  const blogCount = await BlogPost.count();
  if (blogCount === 0) {
    console.log('Seeding initial medical blog posts...');
    const sampleBlogs = [
      {
        title: 'Understanding Knee Replacement Surgery: Causes, Procedure & Recovery Tips',
        slug: 'understanding-knee-replacement-surgery-causes-procedure-recovery-tips',
        category: 'Orthopedics',
        author: 'Dr. S. S. Gill',
        readTime: '6 min read',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Knee replacement surgery can relieve severe joint pain and restore mobility for patients suffering from advanced osteoarthritis or cartilage damage.',
        content: `
          <h2>Overview of Knee Replacement Surgery</h2>
          <p>Knee replacement surgery (arthroplasty) is one of the most successful orthopedic procedures performed today. It involves replacing damaged cartilage and bone in the knee joint with artificial implants made of durable metal alloys and high-grade polymers.</p>

          <h3>Common Indications for Joint Replacement</h3>
          <p>Patients typically consider knee replacement when conservative treatments such as physical therapy, anti-inflammatory medications, and intra-articular injections no longer provide sufficient pain relief.</p>
          <ul>
            <li><strong>Severe Osteoarthritis:</strong> Degeneration of joint cartilage leading to painful bone-on-bone friction.</li>
            <li><strong>Post-Traumatic Arthritis:</strong> Damage caused by previous knee injuries or ligament tears.</li>
            <li><strong>Chronic Stiffness & Reduced Mobility:</strong> Difficulty walking, climbing stairs, or standing up from a chair.</li>
          </ul>

          <h3>What Happens During the Surgical Procedure?</h3>
          <p>During total knee replacement, the surgeon carefully removes the worn-out surfaces of the femur and tibia. A precision-engineered metal femoral cap and tibial tray are fixed in place using specialized surgical bone cement. A smooth plastic spacer is inserted between them to mimic smooth joint movement.</p>

          <blockquote>
            "Modern minimally invasive surgical techniques and computerized navigation allow for precise implant positioning, reduced tissue trauma, and faster recovery times."
          </blockquote>

          <h3>Post-Operative Recovery & Rehabilitation</h3>
          <p>Rehabilitation begins within 24 hours after surgery under guidance of specialized physiotherapists. Most patients are able to walk independently with a walker or cane within a few days and resume normal daily activities within 4 to 6 weeks.</p>
        `,
        tags: 'Orthopedics, Knee Surgery, Joint Health, Rehabilitation',
        seoTitle: 'Knee Replacement Surgery Guide: Causes, Procedure & Recovery',
        seoDescription: 'Learn about knee replacement surgery indications, surgical techniques, and recovery tips from top orthopedic specialists.',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(),
        views: 142,
      },
      {
        title: 'Advances in Modern Cancer Care & Surgical Oncology in India',
        slug: 'advances-in-modern-cancer-treatment-surgical-oncology-india',
        category: 'Oncology',
        author: 'Dr. Harpreet Singh',
        readTime: '8 min read',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Explore breakthroughs in multidisciplinary cancer care, minimally invasive surgical oncology, targeted therapies, and patient survival outcomes.',
        content: `
          <h2>The Evolution of Cancer Care</h2>
          <p>In recent years, surgical oncology and cancer treatment in India have experienced a transformational leap. With advanced diagnostic tools such as PET-CT scans, genomic profiling, and multi-disciplinary tumor boards, treatment plans are now tailored to individual genetic profiles.</p>

          <h3>Role of Surgical Oncology in Cancer Management</h3>
          <p>Surgery remains one of the primary and most effective modalities for solid tumor management. Organ-preserving surgical procedures and laparoscopic tumor resections allow for complete oncological clear margins while preserving organ function and aesthetics.</p>

          <h3>Multidisciplinary Treatment Approach</h3>
          <p>Comprehensive cancer institutes combine several modalities for optimal results:</p>
          <ul>
            <li><strong>Precision Surgical Resection:</strong> Complete removal of primary tumor masses and regional lymph nodes.</li>
            <li><strong>Targeted Chemotherapy:</strong> Medications designed to specifically target cancer cell receptors while sparing healthy cells.</li>
            <li><strong>Advanced Radiation Therapy:</strong> High-precision beam delivery minimizing damage to adjacent healthy tissue.</li>
          </ul>

          <h3>Importance of Early Detection</h3>
          <p>Regular health screening checkups and awareness of warning symptoms (such as unexplained weight loss, persistent lumps, or chronic fatigue) play a vital role in early diagnosis and cure rates.</p>
        `,
        tags: 'Cancer Care, Surgical Oncology, Chemotherapy, Oncology',
        seoTitle: 'Advances in Surgical Oncology & Cancer Treatment in India',
        seoDescription: 'Discover modern breakthroughs in surgical oncology, targeted therapies, and cancer treatment facilities in India.',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86400000 * 2),
        views: 210,
      },
      {
        title: 'Plastic & Reconstructive Surgery: Essential Preparation & Expectations',
        slug: 'plastic-reconstructive-surgery-what-patients-need-to-know',
        category: 'Plastic Surgery',
        author: 'Clinic By Choice Editorial Team',
        readTime: '5 min read',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Understand the difference between cosmetic and reconstructive plastic surgery, consultation steps, recovery protocols, and finding accredited specialists.',
        content: `
          <h2>Understanding Plastic & Reconstructive Surgery</h2>
          <p>Plastic surgery encompasses both reconstructive procedures—designed to restore function and appearance damaged by trauma, burns, or congenital defects—and aesthetic cosmetic procedures aimed at enhancing natural physical features.</p>

          <h3>Key Steps Before Surgery</h3>
          <p>Proper preparation is crucial for achieving optimal aesthetic and functional results:</p>
          <ol>
            <li><strong>In-depth Specialist Consultation:</strong> Discussing patient expectations, medical history, and customized surgical plans.</li>
            <li><strong>Pre-Operative Diagnostics:</strong> Blood work, cardiac evaluation, and imaging.</li>
            <li><strong>Post-Surgical Care Planning:</strong> Arranging dedicated recovery time and following wound care protocols.</li>
          </ol>
        `,
        tags: 'Plastic Surgery, Aesthetic Medicine, Reconstruction',
        seoTitle: 'Plastic & Reconstructive Surgery Guide | Clinic By Choice',
        seoDescription: 'A complete guide to preparing for plastic and reconstructive surgery with top certified surgeons.',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86400000 * 5),
        views: 95,
      },
      {
        title: 'Essential Pediatric Health Tips: Navigating Seasonal Flu & Childhood Immunization',
        slug: 'essential-pediatric-care-tips-seasonal-illnesses-child-health',
        category: 'Pediatrics',
        author: 'Dr. Amanpreet Kaur',
        readTime: '4 min read',
        image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1cdb?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Practical advice for parents on strengthening children immune systems, staying up to date with vaccination schedules, and identifying early fever symptoms.',
        content: `
          <h2>Childhood Health & Immunity Basics</h2>
          <p>Children are particularly vulnerable to viral infections during seasonal transitions. Ensuring balanced nutrition, adequate sleep, and timely vaccinations forms the foundation of lifelong health.</p>

          <h3>Key Preventive Measures</h3>
          <ul>
            <li><strong>Vaccination Compliance:</strong> Adhering to the Indian Academy of Pediatrics (IAP) immunization schedule.</li>
            <li><strong>Hydration & Nutrition:</strong> Providing fresh fruits rich in Vitamin C and essential minerals.</li>
            <li><strong>Hand Hygiene:</strong> Teaching proper handwashing habits before meals.</li>
          </ul>
        `,
        tags: 'Pediatrics, Child Care, Vaccination, Seasonal Health',
        seoTitle: 'Pediatric Care & Immunization Guide for Parents',
        seoDescription: 'Expert pediatric health advice for managing seasonal flu, fever, and childhood immunization schedules.',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86400000 * 7),
        views: 180,
      },
      {
        title: 'Laparoscopic Surgery vs Open Surgery: Benefits, Recovery & Patient Benefits',
        slug: 'laparoscopic-surgery-vs-open-surgery-benefits-healing-time',
        category: 'General Surgery',
        author: 'Clinic By Choice Health Desk',
        readTime: '7 min read',
        image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80',
        excerpt: 'Discover why minimally invasive laparoscopic surgery reduces hospital stay, minimizes scarring, and offers significantly faster postoperative recovery.',
        content: `
          <h2>What is Laparoscopic Surgery?</h2>
          <p>Laparoscopic (keyhole) surgery utilizes specialized tiny incisions, HD cameras, and micro-instruments to perform complex abdominal procedures with extreme precision.</p>

          <h3>Advantages Over Conventional Open Surgery</h3>
          <ul>
            <li><strong>Smaller Incisions:</strong> Incisions are usually only 0.5 to 1 cm compared to large open surgical cuts.</li>
            <li><strong>Less Postoperative Pain:</strong> Significantly reduced pain medication requirements.</li>
            <li><strong>Shorter Hospital Stay:</strong> Patients often return home within 24 to 48 hours.</li>
            <li><strong>Rapid Return to Work:</strong> Healing times are cut by more than half in most cases.</li>
          </ul>
        `,
        tags: 'Laparoscopy, Minimally Invasive, Recovery, Surgery',
        seoTitle: 'Laparoscopic vs Open Surgery Comparison | Clinic By Choice',
        seoDescription: 'Learn why laparoscopic surgery offers faster recovery times, minimal scarring, and shorter hospital stays.',
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86400000 * 10),
        views: 310,
      },
    ];

    for (const blog of sampleBlogs) {
      await BlogPost.create(blog);
    }
  }

  console.log('Database seeding complete with Union Super Speciality Hospital & Blog Posts!');
}
