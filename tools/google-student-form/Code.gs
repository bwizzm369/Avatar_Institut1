/**
 * Avatar Institut — Google Form generator (standalone, final)
 *
 * Creates a short student data update form (3 sections) + linked response Sheet.
 * Does NOT call Supabase, create accounts, Student Pass, certificates, or enrollments.
 *
 * Run once: createAvatarStudentForm()
 */

var FORM_TITLE =
  'تحديث بيانات طلاب معهد الأفاتار\nAvatar Institut — Student Data Update';

var FORM_DESCRIPTION =
  'نعمل حالياً على تحديث قاعدة بيانات طلاب معهد الأفاتار وربط بيانات الطلاب والدورات والشهادات السابقة بالمنصة الرقمية الجديدة.\n\n' +
  'يرجى تعبئة البيانات بدقة حتى نتمكن من مطابقة معلوماتك مع سجلات المعهد.\n\n' +
  'مهم:\n' +
  'اكتب اسمك الكامل بالحروف اللاتينية كما تريد أن يظهر في حسابك وشهاداتك.';

var CONFIRMATION_MESSAGE =
  'شكراً لك 🌿\n\nتم استلام بياناتك بنجاح وسيتم مطابقتها مع سجلات معهد الأفاتار.';

var COURSE_CHOICES = [
  'دورة الكونتو',
  'دورة الغيب',
  'دورة الشكر',
  'دور جزيئات القدر',
  'دورة الاستدعاء روحي',
  'دورة هندسة الوجود',
  'دورة الحجامة الاحترافية',
  'دورة الاستيقاظ المستوى الأول',
  'دورة الاستيقاظ المستوى الثاني',
  'دورة الاستيقاظ المستوى الثالث',
  'دورة الاستيقاظ المستوى الرابع',
  'أخرى / Other',
];

var COUNTRY_CHOICES = [
  'Morocco',
  'France',
  'Germany',
  'Belgium',
  'Luxembourg',
  'Switzerland',
  'Spain',
  'Italy',
  'Netherlands',
  'United Kingdom',
  'United States',
  'Canada',
  'Saudi Arabia',
  'United Arab Emirates',
  'Qatar',
  'Kuwait',
  'Algeria',
  'Tunisia',
  'Egypt',
  'Other',
];

/** Exact response-sheet headers for later Admin CSV/XLSX import. */
var IMPORT_HEADERS = [
  'timestamp',
  'full_name',
  'email',
  'phone',
  'country',
  'courses',
  'has_certificate',
  'old_certificate_number',
];

/**
 * Main entry point.
 * Creates Form + Sheet, links them, renames headers, writes IMPORT_GUIDE, logs URLs.
 */
function createAvatarStudentForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION);
  form.setConfirmationMessage(CONFIRMATION_MESSAGE);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(true);
  form.setIsQuiz(false);

  addFormItems_(form);

  var spreadsheet = SpreadsheetApp.create(
    'Avatar Institut — Student Data Update (Responses)'
  );
  form.setDestination(
    FormApp.DestinationType.SPREADSHEET,
    spreadsheet.getId()
  );

  Utilities.sleep(3000);
  renameResponseHeaders_(spreadsheet);
  writeImportGuideSheet_(spreadsheet);

  var publicUrl = form.getPublishedUrl();
  var editUrl = form.getEditUrl();
  var sheetUrl = spreadsheet.getUrl();

  Logger.log('========================================');
  Logger.log('Avatar Institut — Student Data Form ready');
  Logger.log('========================================');
  Logger.log('Public form URL:');
  Logger.log(publicUrl);
  Logger.log('');
  Logger.log('Form edit URL:');
  Logger.log(editUrl);
  Logger.log('');
  Logger.log('Google Sheet URL:');
  Logger.log(sheetUrl);
  Logger.log('========================================');
  Logger.log('No Supabase. No accounts. No Student Pass.');
  Logger.log('No certificates. No enrollments. No auto-sync.');
  Logger.log('========================================');

  return {
    publicUrl: publicUrl,
    editUrl: editUrl,
    sheetUrl: sheetUrl,
  };
}

/**
 * Builds the form: 3 short sections for mobile.
 */
function addFormItems_(form) {
  // Section 1 — Student information (first page)
  form
    .addSectionHeaderItem()
    .setTitle('بيانات الطالب')
    .setHelpText('Student Information');

  var fullName = form.addTextItem();
  fullName
    .setTitle('الاسم الكامل بالحروف اللاتينية\nFull name')
    .setHelpText(
      'اكتب اسمك الكامل بالحروف اللاتينية كما تريد أن يظهر في حسابك وشهاداتك.\n\n' +
        'مثال:\nNadia El Mansouri'
    )
    .setRequired(true);
  fullName.setValidation(
    FormApp.createTextValidation()
      .setHelpText(
        'يرجى كتابة الاسم بالحروف اللاتينية (A-Z).\nPlease use Latin letters (A-Z).'
      )
      .requireTextMatchesPattern('.*[A-Za-z].*')
      .build()
  );

  var email = form.addTextItem();
  email
    .setTitle('البريد الإلكتروني\nEmail')
    .setRequired(true);
  email.setValidation(
    FormApp.createTextValidation()
      .setHelpText(
        'يرجى إدخال بريد إلكتروني صالح.\nPlease enter a valid email address.'
      )
      .requireTextIsEmail()
      .build()
  );

  form
    .addTextItem()
    .setTitle('رقم الهاتف مع رمز الدولة\nPhone')
    .setHelpText('مثال:\n+212600000000')
    .setRequired(true);

  form
    .addListItem()
    .setTitle('البلد\nCountry')
    .setChoiceValues(COUNTRY_CHOICES)
    .setRequired(true);

  // Section 2 — Previous courses
  form
    .addPageBreakItem()
    .setTitle('الدورات السابقة')
    .setHelpText('Previous Courses');

  form
    .addCheckboxItem()
    .setTitle('الدورات التي سبق لك دراستها في معهد الأفاتار')
    .setHelpText('يمكنك اختيار أكثر من دورة.')
    .setChoiceValues(COURSE_CHOICES)
    .setRequired(true);

  // Section 3 — Certificates
  form
    .addPageBreakItem()
    .setTitle('الشهادات')
    .setHelpText('Certificates');

  form
    .addMultipleChoiceItem()
    .setTitle('هل سبق أن حصلت على شهادة من معهد الأفاتار؟')
    .setChoiceValues(['نعم', 'لا'])
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('رقم الشهادة القديمة إن كان متوفراً')
    .setHelpText('إذا كنت لا تعرف الرقم، اترك هذا الحقل فارغاً.')
    .setRequired(false);
}

/**
 * Renames Form Responses headers to import-friendly keys.
 */
function renameResponseHeaders_(spreadsheet) {
  var sheet = findResponseSheet_(spreadsheet);
  if (!sheet) {
    Logger.log('Warning: response sheet not found yet; headers not renamed.');
    return;
  }

  var lastCol = Math.max(sheet.getLastColumn(), IMPORT_HEADERS.length);
  sheet.getRange(1, 1, 1, IMPORT_HEADERS.length).setValues([IMPORT_HEADERS]);

  if (lastCol > IMPORT_HEADERS.length) {
    sheet.getRange(1, IMPORT_HEADERS.length + 1, 1, lastCol).clearContent();
  }
}

/**
 * Documents column mapping for Admin import. No live sync.
 */
function writeImportGuideSheet_(spreadsheet) {
  var guide = spreadsheet.getSheetByName('IMPORT_GUIDE');
  if (!guide) {
    guide = spreadsheet.insertSheet('IMPORT_GUIDE', 0);
  } else {
    guide.clear();
  }

  var rows = [
    ['Avatar Institut — Student Data Update'],
    ['Purpose', 'Collect student data for later Admin CSV/XLSX import'],
    ['Supabase sync', 'NONE'],
    ['Creates accounts', 'NO'],
    ['Creates Student Pass', 'NO'],
    ['Creates certificates', 'NO'],
    ['Creates enrollments', 'NO'],
    [''],
    ['Column key', 'Form question', 'Required', 'Notes'],
    ['timestamp', '(auto)', '—', 'Google Forms submission time'],
    [
      'full_name',
      'الاسم الكامل بالحروف اللاتينية / Full name',
      'YES',
      'Latin letters A-Z required',
    ],
    ['email', 'البريد الإلكتروني / Email', 'YES', 'Email validation'],
    [
      'phone',
      'رقم الهاتف مع رمز الدولة / Phone',
      'YES',
      'Example +212600000000',
    ],
    ['country', 'البلد / Country', 'YES', 'Dropdown'],
    [
      'courses',
      'الدورات التي سبق لك دراستها في معهد الأفاتار',
      'YES',
      'Checkboxes; multiple values in one cell',
    ],
    [
      'has_certificate',
      'هل سبق أن حصلت على شهادة من معهد الأفاتار؟',
      'YES',
      'نعم / لا',
    ],
    [
      'old_certificate_number',
      'رقم الشهادة القديمة إن كان متوفراً',
      'NO',
      'Leave blank if unknown',
    ],
    [''],
    [
      'Removed fields',
      'full_name_ar, student_pass, notes, course_year, course_dates',
    ],
    [
      'Next step',
      'File → Download → CSV or XLSX → import via Admin Avatar Institut',
    ],
  ];

  guide.getRange(1, 1, rows.length, 4).setValues(
    rows.map(function (row) {
      while (row.length < 4) {
        row.push('');
      }
      return row;
    })
  );
  guide.setColumnWidth(1, 220);
  guide.setColumnWidth(2, 420);
  guide.setColumnWidth(3, 100);
  guide.setColumnWidth(4, 360);
}

/**
 * Finds the Form Responses sheet created by setDestination.
 */
function findResponseSheet_(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  var i;
  for (i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (
      name.indexOf('Form Responses') === 0 ||
      name.indexOf('ردود النموذج') === 0
    ) {
      return sheets[i];
    }
  }
  for (i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== 'IMPORT_GUIDE') {
      return sheets[i];
    }
  }
  return null;
}
