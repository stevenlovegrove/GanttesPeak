class Scroller
{
    constructor(parent_scroll_element)
    {
        this.$document = parent_scroll_element;

        this.left = 0;
        this.top = 0;
        this.scrollHTimer = 0;
        this.scrollVTimer = 0;

        let self = this;
        this.$document.on("scroll", function(){
            self.onScroll();
        } );
    }

    onScroll()
    {
        let self = this;

        var docLeft = this.$document.scrollLeft();
        if(this.left !== docLeft) {
            if(!this.scrollHTimer) {
                this.startHScroll()
            }
            window.clearTimeout(this.scrollHTimer);
            this.scrollHTimer = window.setTimeout(function () {
                self.scrollHTimer = 0;
                self.stopHScroll();
            }, 100);
            this.left = docLeft;
        }

        var docTop = this.$document.scrollTop();
        if(this.top !== docTop) {
            if(!this.scrollVTimer) {
                this.startVScroll();
            }
            window.clearTimeout(this.scrollVTimer);
            let self = this;
            this.scrollVTimer = window.setTimeout(function () {
                self.scrollVTimer = 0;
                self.stopVScroll();
            }, 100);
            this.top = docTop;
        }
    }

    startHScroll ()
    {
        $(".fixed-vertical").each(function () {
            let el = $(this);
            el.css("left","");
            el.css("top", el.offset().top);
            el.css("position", "absolute");
        });
    }

    stopHScroll () {
        var docLeft = this.$document.scrollLeft();
        $(".fixed-vertical").each(function () {
            let el = $(this);
            el.css("top","");
            el.css("left", el.position().left-docLeft);
            el.css("position", "fixed");
        });
    }

    startVScroll()
    {
        $(".fixed-horizontal").each(function () {
            let el = $(this);
            el.css("top","");
            el.css("left", el.offset().left);
            el.css("position", "absolute");
        });
    }

    stopVScroll()
    {
        var docTop = this.$document.scrollTop();
        $(".fixed-horizontal").each(function () {
            let el = $(this);
            el.css("left","");
            el.css("top", el.position().top-docTop);
            el.css("position", "fixed");
        });
    }
}
