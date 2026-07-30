const portfolioConfig = Object.freeze({
  name: 'Manav Agarwal',
  role: 'Creative Frontend Developer',
  location: 'Hyderabad, India',
  availability: 'Open to junior frontend roles and freelance projects',
  email: 'monographpixel@gmail.com',
  githubUrl: 'https://github.com/manav193',
  linkedinUrl: null,
  resumePath: 'Manav-Agarwal-Resume.pdf',
  deployedPortfolioUrl: 'https://manavagarwal.me',
  socialImagePath: 'assets/manav-agarwal-portfolio-og.jpg',
  featuredProjectIds: ['arcade-os','nimo','toolverse','shift-zero','love','velora-bites','nintendo','nike','fate-ai','flora-and-flavor','veldora-bites','prompt-ai','multi-api-system','resume-ai','route-73-night-shift','aurora-control-ui','shift-zero-ui'],
  projects: Object.freeze({
    'arcade-os': Object.freeze({ status:'Live', liveUrl:'#intro-sequence', githubUrl:'https://github.com/manav193/MY-PORTFOLIO', caseStudyPath:'project-arcade-os.html' }),
    nimo: Object.freeze({ status:'Live', liveUrl:'#nimo-widget', githubUrl:'https://github.com/manav193/NIMO-CORE', caseStudyPath:'project-nimo.html' }),
    toolverse: Object.freeze({ status:'Live', liveUrl:'https://tool-verse-theta.vercel.app/', githubUrl:'https://github.com/manav193/ToolVerse', caseStudyPath:'project-toolverse.html' }),
    'shift-zero': Object.freeze({ status:'In Development', liveUrl:null, githubUrl:'https://github.com/manav193/SHIFT-ZERO', caseStudyPath:'project-shift-zero.html' }),
    love: Object.freeze({ status:'Archived', liveUrl:null, githubUrl:'https://github.com/manav193/LOVE', caseStudyPath:'project-love-journey.html' }),
    'velora-bites': Object.freeze({ status:'Prototype', liveUrl:null, githubUrl:'https://github.com/manav193/VELORA-BITES-UI', caseStudyPath:'project-velora-bites.html' }),
    nintendo: Object.freeze({ status:'Prototype', liveUrl:null, githubUrl:'https://github.com/manav193/NITENDO-UI', caseStudyPath:'project-nintendo.html' }),
    nike: Object.freeze({ status:'Prototype', liveUrl:null, githubUrl:'https://github.com/manav193', caseStudyPath:'project-nike.html' }),
    'fate-ai': Object.freeze({ status:'In Development', liveUrl:null, githubUrl:'https://github.com/manav193/FATE-AI', caseStudyPath:'assets/case-studies/public-project.html?id=fate-ai' }),
    'flora-and-flavor': Object.freeze({ status:'Portfolio Concept', liveUrl:null, githubUrl:'https://github.com/manav193/Flora-and-Flavor', caseStudyPath:'assets/case-studies/public-project.html?id=flora-and-flavor' }),
    'veldora-bites': Object.freeze({ status:'Live', liveUrl:'https://veldora-bites.vercel.app/', githubUrl:'https://github.com/manav193/VELDORA-BITES', caseStudyPath:'assets/case-studies/veldora-bites.html' }),
    'prompt-ai': Object.freeze({ status:'Product Concept', liveUrl:null, githubUrl:'https://github.com/manav193/Prompt-Aii', caseStudyPath:'project-promptai.html' }),
    'multi-api-system': Object.freeze({ status:'Earlier Prototype', liveUrl:null, githubUrl:'https://github.com/manav193/Multi_API_system', caseStudyPath:'assets/case-studies/public-project.html?id=multi-api-system' }),
    'resume-ai': Object.freeze({ status:'Android Concept', liveUrl:null, githubUrl:'https://github.com/manav193/resume-ai', caseStudyPath:'assets/case-studies/public-project.html?id=resume-ai' }),
    'route-73-night-shift': Object.freeze({ status:'Game Concept', liveUrl:null, githubUrl:'https://github.com/manav193/Route-73-Night-Shift', caseStudyPath:'index.html#work' }),
    'aurora-control-ui': Object.freeze({ status:'UI Prototype', liveUrl:null, githubUrl:'https://github.com/manav193/AURORA-CONTROL-UI', caseStudyPath:'assets/case-studies/public-project.html?id=aurora-control-ui' }),
    'shift-zero-ui': Object.freeze({ status:'Design Prototype', liveUrl:null, githubUrl:'https://github.com/manav193/SHIFT-ZERO-UI', caseStudyPath:'assets/case-studies/public-project.html?id=shift-zero-ui' })
  })
});
if (typeof module !== 'undefined' && module.exports) module.exports = portfolioConfig;
export default portfolioConfig;
export { portfolioConfig };