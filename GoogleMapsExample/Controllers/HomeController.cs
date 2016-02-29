using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace GoogleMapsExample.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        public ActionResult Test()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public ActionResult Home2()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public ActionResult Home3()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}