class DateBar
{
    constructor(svg)
    {
        let rh = GantTaskLayout.bar_height / 4;
        this.svg = {
            year:  svg.svg(0,0*rh,"100%",rh, {class:"years"}),
            month: svg.svg(0,1*rh,"100%",rh, {class:"months"}),
            week:  svg.svg(0,2*rh,"100%",rh, {class:"weeks"}),
            day:   svg.svg(0,3*rh,"100%",rh, {class:"days"}),
        }
        this.intervals = {
            year : [],
            month : [],
            week : [],
            day : []
        }

        let start = moment().subtract(GantTaskLayout.pre_ms,'ms');
        let end   = start.clone().add(5,'years');

        this.PushIntervals(svg, this.intervals.year, 'year', start, end, this.svg.year, rh);
        this.PushIntervals(svg, this.intervals.month, 'month', start, end, this.svg.month, rh);
        this.PushIntervals(svg, this.intervals.week, 'week', start, end, this.svg.week, rh);
        this.PushIntervals(svg, this.intervals.day, 'day', start, end, this.svg.day, rh);
    }

    PushIntervals(svg, intervals, unit, start, end, group, rh)
    {
        let ts = start.clone().startOf(unit);
        while (ts < end) {
            let cls = unit;
            if(unit == 'day' && ts.isoWeekday() >= 6) {
                cls+=' weekend';
            }
            let rect = svg.rect(group, 0, 0, 0, rh, {class:cls});
            intervals.push({svg:rect, start:ts.clone(), end:ts.add(1,unit).clone() });
        }
    }

    UpdateIntervals(intervals, vel_dur_ms, offset_px)
    {
        let opt_show = {display:"block", duration: vel_dur_ms};
        let opt_hide = {display:"none", duration: vel_dur_ms};

        for(let i=0; i < intervals.length; ++i) {
            let v = intervals[i];
            let size_px = TimeToPixels(v.end - v.start);
            $(v.svg).velocity({
                x: TimeToPixels(v.start) - offset_px,
                width: size_px
            }, size_px > 2 ? opt_show : opt_hide);
        }
    }

    Update(vel_dur_ms)
    {
        let w = GantTaskLayout.w;
        let h = GantTaskLayout.h;
        let bar_height = GantTaskLayout.bar_height;
        let s = TimeToPixels(TimeNow_ms() - GantTaskLayout.pre_ms);

        $(this.svg.year).velocity({ x : s }, {duration: vel_dur_ms} );
        $(this.svg.month).velocity({ x : s }, {duration: vel_dur_ms} );
        $(this.svg.week).velocity({ x : s }, {duration: vel_dur_ms} );
        $(this.svg.day).velocity({ x : s }, {duration: vel_dur_ms} );

        this.UpdateIntervals(this.intervals.year, vel_dur_ms, s);
        this.UpdateIntervals(this.intervals.month, vel_dur_ms, s);
        this.UpdateIntervals(this.intervals.week, vel_dur_ms, s);
        this.UpdateIntervals(this.intervals.day, vel_dur_ms, s);
    }
}
